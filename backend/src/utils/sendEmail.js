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
 * Send Email via Resend API (production) or Nodemailer SMTP (local dev fallback).
 *
 * Production (Render):  Set RESEND_API_KEY env var → uses Resend HTTP API (reliable from any cloud server).
 * Local Dev:            Set EMAIL_USER + EMAIL_PASS env vars → uses Nodemailer + Gmail SMTP.
 *
 * Required env vars for Resend:
 *   RESEND_API_KEY     — API key from https://resend.com/api-keys
 *   EMAIL_FROM         — (optional) Sender, defaults to "CampusBazzar <onboarding@resend.dev>"
 *
 * Required env vars for Nodemailer (local dev fallback):
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  // ─── Strategy 1: Resend API (preferred for production / cloud servers) ───
  if (resendApiKey && Resend) {
    const from = process.env.EMAIL_FROM || 'CampusBazzar <onboarding@resend.dev>';
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      if (error) {
        console.error(`[Resend Error] Failed to send email to ${to}:`, error.message || JSON.stringify(error));
        return { success: false, error: error.message || 'Resend API error' };
      }

      console.log(`[Resend OK] Email sent to ${to} (ID: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error(`[Resend Error] Exception sending email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // ─── Strategy 2: Nodemailer SMTP (local dev with Gmail App Password) ───
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || `"CampusBazzar NIT Patna" <${user}>`;

  if (!nodemailer || !user || !pass) {
    console.warn(`[EMAIL WARNING] No RESEND_API_KEY and no EMAIL_USER/EMAIL_PASS configured. Email to: ${to} | Subject: ${subject}`);
    return { success: false, simulated: true, error: 'Email credentials not configured (set RESEND_API_KEY or EMAIL_USER+EMAIL_PASS)' };
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

    console.log(`[SMTP OK] Email sent to ${to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
