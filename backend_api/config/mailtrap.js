const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const isGmailService =
  process.env.MAIL_SERVICE && process.env.MAIL_SERVICE.toLowerCase() === 'gmail';

const transport = nodemailer.createTransport({
   ...(isGmailService
    ? {
        service: 'gmail',
      }
    : {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: Number(process.env.MAIL_PORT) === 465,
      }),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transport.verify((err) => {
  if (err) {
    console.error('SMTP connection error:', err);
  } else {
    console.log('Mailer is ready to send messages');
  }
});

module.exports = transport;
