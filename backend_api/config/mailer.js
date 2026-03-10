const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.MAIL_USER,
    clientId: process.env.MAIL_CLIENT_ID,
    clientSecret: process.env.MAIL_CLIENT_SECRET,
    refreshToken: process.env.MAIL_REFRESH_TOKEN
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.error("OAuth2 error:", error);
  } else {
    console.log("Real Gmail Mailer (OAuth2) is ready to go!");
  }
});

module.exports = transporter;