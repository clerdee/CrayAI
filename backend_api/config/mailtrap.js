const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const mailService = (process.env.MAIL_SERVICE || '').toLowerCase();
const smtpHost = (process.env.MAIL_HOST || '').toLowerCase();

const isMailtrapHost = smtpHost.includes('mailtrap');
const shouldUseGmail = mailService !== 'smtp';

if (!mailUser || !mailPass) {
  throw new Error('MAIL_USER and MAIL_PASS are required for OTP email delivery.');
}

if (shouldUseGmail && !/@gmail\.com$/i.test(mailUser)) {
  throw new Error('MAIL_USER must be a Gmail address unless MAIL_SERVICE=smtp is used.');
}

if (!shouldUseGmail && isMailtrapHost) {
  throw new Error(
    'Mailtrap SMTP is blocked for OTP delivery. Use Gmail credentials or a non-Mailtrap SMTP provider.'
  );
}

const transport = nodemailer.createTransport({
  ...(shouldUseGmail
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

console.log(`Mail transport selected: ${shouldUseGmail ? 'gmail' : 'smtp'}`);

transport.verify((err) => {
  if (err) {
    console.error('SMTP connection error:', err);
  } else {
    console.log('Mailer is ready to send messages');
  }
});

module.exports = transport;
