const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  image: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Contact", ContactSchema);