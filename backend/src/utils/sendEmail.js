let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

let Resend;
try {
  const resendModule = require('resend');
  Resend = resendModule.Resend;
} catch (e) {
  Resend = null;
}

/**
 * Universal Email Sender for CampusBazzar
 *
 * Strategy 1: Nodemailer with Gmail SMTP (direct sending to all domains without restrictions)
 * Strategy 2: Resend HTTP API (cloud-native fallback if SMTP ports are blocked)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;

  let lastError = null;

  // ─── 1. Primary Strategy: Gmail SMTP via Nodemailer ───
  if (nodemailer && user && pass) {
    try {
      const from = process.env.EMAIL_FROM || `"CampusBazzar NIT Patna" <${user}>`;
      
      // Use service: 'gmail' which automatically configures optimal SSL port (465) & host for Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: text || '',
        html: html || '',
      });

      console.log(`[SMTP Gmail OK] Email delivered to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'gmail-smtp' };
    } catch (smtpErr) {
      console.warn(`[SMTP Gmail Warning] Failed for ${to} (${smtpErr.message}). Attempting fallback...`);
      lastError = smtpErr.message;
    }
  }

  // ─── 2. Secondary Strategy: Resend HTTP API ───
  if (resendApiKey && Resend) {
    try {
      let from = process.env.EMAIL_FROM || 'CampusBazzar <onboarding@resend.dev>';
      // Resend will reject any 'from' address with @gmail.com or unverified domain
      if (!from.includes('@resend.dev') && !from.includes('.resend.app')) {
        from = 'CampusBazzar <onboarding@resend.dev>';
      }

      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      if (error) {
        console.error(`[Resend Error] Failed for ${to}:`, error.message || JSON.stringify(error));
        lastError = error.message || 'Resend API error';
      } else {
        console.log(`[Resend OK] Email sent to ${to} (ID: ${data?.id})`);
        return { success: true, messageId: data?.id, provider: 'resend' };
      }
    } catch (resendErr) {
      console.error(`[Resend Exception] Error sending to ${to}:`, resendErr.message);
      lastError = resendErr.message;
    }
  }

  // ─── If both failed or unconfigured ───
  console.error(`[EMAIL DISPATCH FAILED] Neither SMTP nor Resend could deliver to ${to}. Error: ${lastError || 'No credentials'}`);
  return {
    success: false,
    error: lastError || 'Email credentials not configured or dispatch rejected',
  };
};

module.exports = sendEmail;
