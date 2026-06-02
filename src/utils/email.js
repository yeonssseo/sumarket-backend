const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (to, code) => {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: '[수마켓] 이메일 인증 코드',
    html: `
      <h2>수마켓 이메일 인증</h2>
      <p>아래 인증 코드를 입력해주세요.</p>
      <p>이 코드는 5분간 유효합니다.</p>
      <h1 style="letter-spacing: 8px; color: #0066cc;">${code}</h1>
    `,
  });
};

module.exports = { sendVerificationEmail };
