let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

/**
 * Send Email using Nodemailer
 * Uses SMTP configuration from process.env (Host, Port, User, Pass)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || `"CampusBazzar NIT Patna" <no-reply@campusbazzar.nitp.ac.in>`;

  if (!nodemailer || !user || !pass) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMTP DEV MODE] To: ${to} | Subject: ${subject}`);
    }
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      family: 4,
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || '',
      html: html || '',
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Error] Could not deliver email:', error.message);
    throw new Error('Failed to deliver verification email. Please check your email address or SMTP credentials.');
  }
};

module.exports = sendEmail;
