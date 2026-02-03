const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT), 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// verify connection
transport.verify((err, success) => {
  if (err) {
    console.error('Mailtrap connection error:', err);
  } else {
    console.log('Mailtrap is ready to send messages');
  }
});

module.exports = transport;
