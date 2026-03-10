const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const isGmailService =
  process.env.MAIL_SERVICE && process.env.MAIL_SERVICE.toLowerCase() === 'gmail';
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

if (isGmailService) {
  if (!mailUser || !mailPass) {
    throw new Error('MAIL_USER and MAIL_PASS are required when MAIL_SERVICE=gmail.');
  }

  if (!/@gmail\.com$/i.test(mailUser)) {
    throw new Error('MAIL_USER must be a Gmail address when MAIL_SERVICE=gmail.');
  }
}

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
    user: mailUser,
    pass: mailPass,
  },
});

console.log(`Mail transport selected: ${isGmailService ? 'gmail' : 'smtp-host'}`);

transport.verify((err) => {
  if (err) {
    console.error('SMTP connection error:', err);
  } else {
    console.log('Mailer is ready to send messages');
  }
});

module.exports = transport;
