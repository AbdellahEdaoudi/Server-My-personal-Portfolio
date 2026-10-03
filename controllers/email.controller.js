const nodemailer = require("nodemailer");

const sendEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        message: "Please fill in all required fields (to, subject, message)."
      });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return res.status(500).json({
        message: "Email credentials are not configured on the server."
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"Abdellah Edaoudi" <${emailUser}>`,
      to: to,
      replyTo: emailUser,
      subject: subject,
      text: message,
    };

    // Attach CV PDF if provided
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

    return res.status(200).json({
      success: true,
      message: "Email sent successfully!"
    });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({
      message: "Failed to send email: " + (error.message || "Unknown error")
    });
  }
};

module.exports = {
  sendEmail,
};
