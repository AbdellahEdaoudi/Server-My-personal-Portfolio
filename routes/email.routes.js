const express = require("express");
const router = express.Router();
const multer = require("multer");
const emailController = require("../controllers/email.controller");
const { verifyJWT } = require("../middleware/verifyJWT");
const { verifyRole } = require("../middleware/verifyRole");

// Store CV attachment in memory (max 10 MB, PDF only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for CV attachment."), false);
    }
  },
});

router.post(
  "/send",
  verifyJWT,
  verifyRole("admin"),
  upload.single("cv"),
  emailController.sendEmail
);

router.post(
  "/send-bulk",
  verifyJWT,
  verifyRole("admin"),
  upload.single("cv"),
  emailController.sendBulkEmails
);

router.get(
  "/status",
  verifyJWT,
  verifyRole("admin"),
  emailController.getBulkStatus
);

router.post(
  "/cancel",
  verifyJWT,
  verifyRole("admin"),
  emailController.cancelBulkJob
);

module.exports = router;
