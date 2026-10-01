const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email.controller");
const { verifyJWT } = require("../middleware/verifyJWT");
const { verifyRole } = require("../middleware/verifyRole");

router.post("/send", verifyJWT, verifyRole("admin"), emailController.sendEmail);

module.exports = router;
