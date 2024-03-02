const mongoose = require("mongoose");

const ConatctSchema = mongoose.Schema({
    name: String,
    email: String,
    msg: String,
    created_at: {
        type: Date,
        default: Date.now(),
    }
});

module.exports = Conatact = mongoose.model("Contact", ConatctSchema);