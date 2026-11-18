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
 * Universal Multi-Provider Email Dispatcher for CampusBazzar
 *
 * Supported Providers in order of priority:
 * 1. Brevo HTTP API (BREVO_API_KEY)  — 300 free emails/day to ANY domain without custom domain verification.
 * 2. Gmail SMTP (EMAIL_USER/PASS)    — Direct Nodemailer transport.
 * 3. Resend HTTP API (RESEND_API_KEY)— Best if custom domain is verified; sends from onboarding@resend.dev.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const user = process.env.EMAIL_USER || 'campusbazzar4@gmail.com';
  const pass = process.env.EMAIL_PASS;

  const errors = [];

  // ─── Provider 1: Brevo HTTP API (Recommended for free cloud delivery) ───
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'CampusBazzar NIT Patna',
            email: user,
          },
          to: [{ email: to }],
          subject,
          htmlContent: html || undefined,
          textContent: text || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Brevo OK] Email delivered to ${to} (MessageId: ${data.messageId})`);
        return { success: true, messageId: data.messageId, provider: 'brevo' };
      } else {
        const msg = data.message || JSON.stringify(data);
        console.error(`[Brevo Error] ${msg}`);
        errors.push(`Brevo: ${msg}`);
      }
    } catch (err) {
      console.error(`[Brevo Exception] ${err.message}`);
      errors.push(`Brevo: ${err.message}`);
    }
  }

  // ─── Provider 2: Gmail SMTP via Nodemailer ───
  if (nodemailer && user && pass) {
    try {
      const from = process.env.EMAIL_FROM || `"CampusBazzar NIT Patna" <${user}>`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
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
      console.warn(`[SMTP Gmail Warning] Failed for ${to}: ${smtpErr.message}`);
      errors.push(`Gmail SMTP: ${smtpErr.message}`);
    }
  }

  // ─── Provider 3: Resend HTTP API (Fallback) ───
  if (resendApiKey && Resend) {
    try {
      let from = process.env.EMAIL_FROM || 'CampusBazzar <onboarding@resend.dev>';
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
        const msg = error.message || JSON.stringify(error);
        console.error(`[Resend Error] Failed for ${to}: ${msg}`);
        errors.push(`Resend: ${msg}`);
      } else {
        console.log(`[Resend OK] Email sent to ${to} (ID: ${data?.id})`);
        return { success: true, messageId: data?.id, provider: 'resend' };
      }
    } catch (resendErr) {
      console.error(`[Resend Exception] Error sending to ${to}: ${resendErr.message}`);
      errors.push(`Resend: ${resendErr.message}`);
    }
  }

  const combinedError = errors.join(' | ') || 'No email service configured or all providers rejected the dispatch';
  console.error(`[EMAIL DISPATCH FAILED] Neither Brevo, Gmail SMTP, nor Resend could deliver to ${to}. Errors: ${combinedError}`);

  return {
    success: false,
    error: combinedError,
  };
};

module.exports = sendEmail;
