const mongoose = require("mongoose");

const BulkJobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "cancelled"],
      default: "pending",
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    cvAttachment: {
      filename: String,
      contentBase64: String,
    },
    skipDuplicateCheck: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    currentEmail: { type: String, default: "" },
    startTime: Date,
    endTime: Date,
    details: [
      {
        email: { type: String, required: true },
        status: {
          type: String,
          enum: ["pending", "sending", "sent", "skipped", "failed", "cancelled"],
          default: "pending",
        },
        duration: Number,
        error: String,
        retries: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkJob", BulkJobSchema);
