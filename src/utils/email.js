const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 인증 코드 이메일 발송
const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '[수마켓] 이메일 인증 코드',
    html: `
      <h2>수마켓 이메일 인증</h2>
      <p>아래 인증 코드를 입력해주세요.</p>
      <p>이 코드는 5분간 유효합니다.</p>
      <h1 style="letter-spacing: 8px; color: #0066cc;">${code}</h1>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
