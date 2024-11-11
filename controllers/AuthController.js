
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Usr = require("../models/User");
const User = require("../models/User");

exports.registerUser = async (req, res) => {
  const { name, email, pass, role } = req.body;
  if (!name || !email || !pass) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const foundUser = await Usr.findOne({ email }).exec();
    if (foundUser) {
      return res.status(401).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = new Usr({ name, email, pass: hashedPassword, role });
    await user.save();
    const accessToken = jwt.sign(
      { UserInfo: { id: user._id, role: user.role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
    const refreshToken = jwt.sign(
      { UserInfo: { id: user._id, role: user.role } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: false,  // true for https 
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.loginUser = async (req, res) => {
  const { email, pass } = req.body;
  if (!email || !pass) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const foundUser = await Usr.findOne({ email }).exec();
    if (!foundUser) {
      return res.status(401).json({ message: "User does not exist" });
    }
    const match = await bcrypt.compare(pass, foundUser.pass);
    if (!match) return res.status(401).json({ message: "Wrong Password" });
    const accessToken = jwt.sign(
      { UserInfo: { id: foundUser._id, role: foundUser.role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn:15}
    );
    const refreshToken = jwt.sign(
      { UserInfo: { id: foundUser._id, role: foundUser.role } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: false,  // true for https
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken,
      email: foundUser.email,
      name: foundUser.name,      
      role: foundUser.role,

    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.refresh = (req, res) => {
  const cookies = req.cookies;
  console.log("Cookies:", cookies); 
  if (!cookies?.jwt) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const refreshToken = cookies.jwt;
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const foundUser = await User.findById(user.UserInfo.id).exec();
    if (!foundUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const accessToken = jwt.sign(
      { UserInfo: { id: foundUser._id, role: foundUser.role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m"}
    );
    
    return res.json({ accessToken });
  });
};

exports.logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  });
  res.json({ message: 'Cookie cleared' });
};