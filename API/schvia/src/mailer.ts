import dotenv from 'dotenv';
const nodemailer = require('nodemailer');

dotenv.config();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});


export const sendMail = async (
  to: string,
  subject: string,
  text: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};