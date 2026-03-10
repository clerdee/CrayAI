const { google } = require('googleapis');
require('dotenv').config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.MAIL_CLIENT_ID,
  process.env.MAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({ refresh_token: process.env.MAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

const transporter = {
  sendMail: async function(mailOptions) {
    try {
      const utf8Subject = `=?utf-8?B?${Buffer.from(mailOptions.subject).toString('base64')}?=`;
      const messageParts = [
        `From: ${mailOptions.from}`,
        `To: ${mailOptions.to}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        '',
        mailOptions.html || mailOptions.text
      ];
      
      const message = messageParts.join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      
      console.log("Email sent successfully via Gmail API!");
      return res;
      
    } catch (error) {
      console.error("Gmail API Error:", error);
      throw error;
    }
  },
  
  verify: function(callback) {
    console.log("Custom Gmail HTTPS Mailer is ready to go!");
    if(callback) callback(null, true);
  }
};

module.exports = transporter;