require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const update = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected.");
        await User.deleteMany({});
       
    } catch (error) {
        console.error("Error resetting users:", error);
        process.exit(1);
    }
};

update();
