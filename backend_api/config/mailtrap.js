const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.error("SMTP error:", error);
  } else {
    console.log("Mailer ready");
  }
});

module.exports = transporter;