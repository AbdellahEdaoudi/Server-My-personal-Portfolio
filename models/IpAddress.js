const mongoose = require("mongoose");

const ipaddressSchema = mongoose.Schema({
  ipaddress: { type: String, required: true }, 
  timestamps: [{ type: Date, default: Date.now }],
});

module.exports = mongoose.model("IpAddress", ipaddressSchema);
