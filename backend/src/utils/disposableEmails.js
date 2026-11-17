/**
 * List of known disposable and temporary email domains
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
  'emailondeck.com',
  'temp-mail.org',
  'burnermail.io',
  'mytemp.email',
  'mohmal.com',
  'crazymailing.com',
  'inboxkitten.com',
  'trashmail.net',
  'tempr.email',
  'discard.email',
  'generator.email',
]);

const isDisposableEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
};

// Validate Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)
const isValidIndianMobile = (phone) => {
  if (!phone) return false;
  const cleaned = phone.toString().replace(/[^0-9]/g, '');
  const last10 = cleaned.slice(-10);
  return /^[6-9]\d{9}$/.test(last10);
};

module.exports = {
  isDisposableEmail,
  isValidIndianMobile,
};
