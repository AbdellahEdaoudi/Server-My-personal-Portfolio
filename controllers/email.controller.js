const nodemailer = require("nodemailer");
const SentEmail = require("../models/sentEmail.model");
const BulkJob = require("../models/bulkJob.model");

// Single reusable pooled SMTP Transporter
let transporterInstance = null;

function getTransporter() {
  if (!transporterInstance) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) return null;

    transporterInstance = nodemailer.createTransport({
      pool: true,
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      maxConnections: 1, // Controlled sequential SMTP connection pool
      maxMessages: 100, 
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }
  return transporterInstance;
}

let activeJobId = null;
let cancelRequested = false;
let isProcessingQueue = false;

// Helper to determine if an SMTP error is transient (retryable) or permanent
function isTransientError(error) {
  if (!error) return false;
  // Permanent errors: 5xx SMTP response codes or invalid address errors
  if (error.responseCode && error.responseCode >= 500 && error.responseCode < 600) {
    return false;
  }
  if (error.code === "EENVELOPE" || error.code === "EDIALOG") {
    return false;
  }
  // Transient errors: timeouts, ECONNRESET, 4xx responses, socket errors
  return true;
}

// Background Worker Processor
async function processQueue(jobDoc) {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  activeJobId = jobDoc.jobId;
  cancelRequested = false;

  const maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES, 10) || 2;
  const delayMs = parseInt(process.env.EMAIL_DELAY_MS, 10) || 15000;
  const transporter = getTransporter();

  jobDoc.status = "running";
  jobDoc.startTime = jobDoc.startTime || new Date();
  await jobDoc.save();

  for (let i = 0; i < jobDoc.details.length; i++) {
    // Skip items already processed in case of resume
    if (jobDoc.details[i].status === "sent" || jobDoc.details[i].status === "skipped") {
      continue;
    }

    if (cancelRequested) {
      jobDoc.status = "cancelled";
      for (let j = i; j < jobDoc.details.length; j++) {
        if (jobDoc.details[j].status === "pending") {
          jobDoc.details[j].status = "cancelled";
        }
      }
      await jobDoc.save();
      break;
    }

    const item = jobDoc.details[i];
    const normalizedEmail = item.email.trim().toLowerCase();
    jobDoc.currentEmail = normalizedEmail;
    item.status = "sending";
    await jobDoc.save();

    const itemStartTime = Date.now();

    // 1. Duplicate check against MongoDB SentEmail collection (if enabled)
    if (!jobDoc.skipDuplicateCheck) {
      try {
        const existing = await SentEmail.findOne({ email: normalizedEmail });
        if (existing) {
          jobDoc.skipped++;
          item.status = "skipped";
          item.duration = Math.round((Date.now() - itemStartTime) / 1000);
          item.error = "Already sent previously";
          await jobDoc.save();
          continue;
        }
      } catch (err) {
        console.error(`Error checking SentEmail for ${normalizedEmail}:`, err);
      }
    }

    if (!transporter) {
      jobDoc.failed++;
      item.status = "failed";
      item.error = "Email credentials not configured on server";
      await jobDoc.save();
      continue;
    }

    const emailUser = process.env.EMAIL_USER;
    const mailOptions = {
      from: `"Abdellah Edaoudi" <${emailUser}>`,
      to: normalizedEmail,
      replyTo: emailUser,
      subject: jobDoc.subject,
      text: jobDoc.message,
    };

    if (jobDoc.cvAttachment && jobDoc.cvAttachment.contentBase64) {
      mailOptions.attachments = [
        {
          filename: jobDoc.cvAttachment.filename || "CV_Abdellah_Edaoudi.pdf",
          content: Buffer.from(jobDoc.cvAttachment.contentBase64, "base64"),
          contentType: "application/pdf",
        },
      ];
    }

    // 2. Send Email with Retry Logic
    let sentSuccess = false;
    let lastError = null;
    let attempts = 0;

    while (attempts <= maxRetries && !sentSuccess) {
      attempts++;
      try {
        await transporter.sendMail(mailOptions);
        sentSuccess = true;
      } catch (sendErr) {
        lastError = sendErr;
        console.error(`Attempt ${attempts} failed for ${normalizedEmail}:`, sendErr.message);

        // If error is permanent, do not retry further
        if (!isTransientError(sendErr)) {
          break;
        }

        // Delay briefly before retrying
        if (attempts <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    if (sentSuccess) {
      // 3. Save to SentEmail collection upon success
      try {
        await SentEmail.create({ email: normalizedEmail });
      } catch (dbErr) {
        // Handle race condition gracefully
        if (dbErr.code !== 11000) {
          console.error(`DB save error for ${normalizedEmail}:`, dbErr);
        }
      }

      jobDoc.sent++;
      item.status = "sent";
      item.duration = Math.round((Date.now() - itemStartTime) / 1000);
      item.retries = attempts - 1;
    } else {
      jobDoc.failed++;
      item.status = "failed";
      item.error = lastError ? (lastError.message || "Failed to send") : "Failed";
      item.duration = Math.round((Date.now() - itemStartTime) / 1000);
      item.retries = attempts - 1;
    }

    await jobDoc.save();

    // 4. Sequential delay before next email
    if (i < jobDoc.details.length - 1 && !cancelRequested) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (jobDoc.status === "running") {
    jobDoc.status = "completed";
  }
  jobDoc.endTime = new Date();
  await jobDoc.save();

  isProcessingQueue = false;
  activeJobId = null;
}

// Auto-resume unfinished jobs on server restart
async function resumePendingJobs() {
  try {
    const unfinishedJob = await BulkJob.findOne({
      status: { $in: ["pending", "running"] },
    }).sort({ createdAt: -1 });

    if (unfinishedJob) {
      console.log(`Resuming unfinished bulk job: ${unfinishedJob.jobId}`);
      processQueue(unfinishedJob);
    }
  } catch (err) {
    console.error("Error resuming pending bulk jobs:", err);
  }
}

// Call auto-resume after DB is ready (safely deferred)
setTimeout(() => {
  resumePendingJobs();
}, 5000);

// POST /api/email/send-bulk
exports.sendBulkEmails = async (req, res) => {
  try {
    let { recipients, subject, message, checkDuplicates } = req.body;
    const skipDuplicateCheck = checkDuplicates === false || checkDuplicates === "false";

    if (!recipients || !subject || !message) {
      return res.status(400).json({
        message: "Please fill in recipients, subject, and message.",
      });
    }

    let emailList = [];
    if (Array.isArray(recipients)) {
      emailList = recipients;
    } else if (typeof recipients === "string") {
      try {
        const parsed = JSON.parse(recipients);
        if (Array.isArray(parsed)) emailList = parsed;
        else emailList = recipients.split("\n");
      } catch {
        emailList = recipients.split("\n");
      }
    }

    emailList = emailList.map((e) => e.trim()).filter((e) => e.length > 0);

    if (emailList.length === 0) {
      return res.status(400).json({
        message: "No valid recipient emails provided.",
      });
    }

    if (isProcessingQueue) {
      return res.status(409).json({
        message: "A bulk email job is currently running on the server.",
      });
    }

    const jobId = "job_" + Date.now();
    const cvAttachment = req.file
      ? {
          filename: req.file.originalname,
          contentBase64: req.file.buffer.toString("base64"),
        }
      : null;

    const newJob = await BulkJob.create({
      jobId,
      status: "pending",
      subject,
      message,
      cvAttachment,
      skipDuplicateCheck,
      total: emailList.length,
      details: emailList.map((email) => ({
        email: email.trim().toLowerCase(),
        status: "pending",
      })),
    });

    // Trigger background execution asynchronously
    processQueue(newJob);

    return res.status(200).json({
      success: true,
      message: "Bulk email job started successfully on the server.",
      jobId,
      totalRecipients: emailList.length,
    });
  } catch (error) {
    console.error("Bulk email start error:", error);
    return res.status(500).json({
      message: "Failed to start bulk email job: " + (error.message || "Unknown error"),
    });
  }
};

// GET /api/email/status
exports.getBulkStatus = async (req, res) => {
  try {
    const job = await BulkJob.findOne().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: job || { status: "idle", total: 0, sent: 0, skipped: 0, failed: 0, details: [] },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch status: " + error.message });
  }
};

// POST /api/email/cancel
exports.cancelBulkJob = async (req, res) => {
  if (isProcessingQueue) {
    cancelRequested = true;
    return res.status(200).json({
      success: true,
      message: "Cancellation request submitted. Stopping bulk sending process...",
    });
  }
  return res.status(400).json({
    message: "No active bulk email job is currently running.",
  });
};

// POST /api/email/send (Single send for backwards compatibility)
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        message: "Please fill in all required fields (to, subject, message).",
      });
    }

    const normalizedEmail = to.trim().toLowerCase();

    // Check if email was already sent
    const existing = await SentEmail.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: `Email has already been sent to (${normalizedEmail}). Skipped.`,
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({
        message: "Email credentials are not configured on the server.",
      });
    }

    const emailUser = process.env.EMAIL_USER;
    const mailOptions = {
      from: `"Abdellah Edaoudi" <${emailUser}>`,
      to: normalizedEmail,
      replyTo: emailUser,
      subject: subject,
      text: message,
    };

    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname || "CV_Abdellah_Edaoudi.pdf",
          content: req.file.buffer,
          contentType: "application/pdf",
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    try {
      await SentEmail.create({ email: normalizedEmail });
    } catch (dbErr) {
      if (dbErr.code !== 11000) {
        console.error(`DB save error for ${normalizedEmail}:`, dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("Single email send error:", error);
    return res.status(500).json({
      message: "Failed to send email: " + (error.message || "Unknown error"),
    });
  }
};
