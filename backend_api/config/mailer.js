const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false 
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.error("SMTP error:", error);
  } else {
    console.log("Real Gmail Mailer is ready to go!");
  }
});

module.exports = transporter;