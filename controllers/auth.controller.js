const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            password: hashedPassword,
            role: "user"
        });

        await newUser.save();
        res.status(201).json({
            message: 'User registered successfully',
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '5s' }
        );
        const refreshToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '20s' }
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });

        res.status(200).json({
            message: 'Login successful',
            user: { _id: user._id, email: user.email, role: user.role },
            accessToken
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

//refresh token
exports.refresh = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ code: "REFRESH_TOKEN_MISSING", message: 'No refresh token' });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
         if (err.name === "TokenExpiredError") {
           return res.status(401).json({
             code: "REFRESH_TOKEN_EXPIRED",
             message: "Refresh token expired"
           });
         }
         return res.status(401).json({
           code: "REFRESH_TOKEN_INVALID",
           message: "Invalid refresh token"
         });
      }
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '5s' }
        );
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });
        res.json({ accessToken });
    });
};


exports.logout = (req, res) => {
    res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'None' });
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'None' });
    res.json({ message: 'Cookie cleared' });
};
