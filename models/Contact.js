const mongoose = require("mongoose");

const ConatctSchema = mongoose.Schema({
    subject: String,
    email: String,
    message: String,
    created_at: {
        type: Date,
        default: Date.now(),
    }
});

module.exports = Conatact = mongoose.model("Contact", ConatctSchema);