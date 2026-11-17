let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

/**
 * Send Email using Nodemailer
 * Uses SMTP configuration from process.env with working CampusBazzar Gmail fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || 'campusbazzar4@gmail.com';
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || 'yeploernoaxdikgf';
  const from = process.env.EMAIL_FROM || `"CampusBazzar NIT Patna" <${user}>`;

  if (!nodemailer || !user || !pass) {
    console.warn(`[SMTP SIMULATOR] Email to: ${to} | Subject: ${subject}`);
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
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || '',
      html: html || '',
    });

    console.log(`[SMTP Sent] Message delivered to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Error] Could not deliver email:', error.message);
    // Return simulated success with error info so registration and OTP flow don't hard-crash
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
