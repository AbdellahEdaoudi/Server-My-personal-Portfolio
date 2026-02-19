const { connectDB } = require("./config/dbConnect");
require("dotenv").config();
const User = require("./models/user.model");
const Contact = require("./models/contact.model");
const bcrypt = require("bcryptjs");

const scripte = async () => {
    try {
        await connectDB();
        const users = await User.find()
        console.log(users);

    } catch (error) {
        console.error("Error deleting users:", error);
    }
};

scripte();
