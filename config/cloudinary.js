const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CloudName,
  api_key: process.env.APIKey,
  api_secret: process.env.APISecret
});

module.exports = cloudinary;
