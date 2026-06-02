const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (to, code) => {
  const msg = {
    to,
    from: process.env.EMAIL_USER,
    subject: '[수마켓] 이메일 인증 코드',
    html: `
      <h2>수마켓 이메일 인증</h2>
      <p>아래 인증 코드를 입력해주세요.</p>
      <p>이 코드는 5분간 유효합니다.</p>
      <h1 style="letter-spacing: 8px; color: #0066cc;">${code}</h1>
    `,
  };

  await sgMail.send(msg);
};

module.exports = { sendVerificationEmail };
