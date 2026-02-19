const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
