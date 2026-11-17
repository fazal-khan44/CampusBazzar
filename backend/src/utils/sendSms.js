/**
 * Pluggable SMS Sender (MSG91 / Twilio / Fast2SMS ready)
 * In development or when no SMS_API_KEY is configured, logs cleanly to console.
 */
const sendSms = async ({ to, message }) => {
  const apiKey = process.env.SMS_API_KEY;
  const cleanedPhone = to.toString().replace(/[^0-9]/g, '').slice(-10);

  if (!apiKey || process.env.NODE_ENV !== 'production') {
    console.log(`[DEV SMS GATEWAY] To: +91${cleanedPhone} | Message: ${message}`);
    return { success: true, simulated: true };
  }

  // Example: If Twilio or MSG91 is plugged in via SMS_PROVIDER in .env
  try {
    // Integration placeholder ready for Twilio / MSG91 HTTP call
    return { success: true };
  } catch (error) {
    console.error('[SMS Error] Could not send SMS:', error.message);
    throw new Error('Failed to send SMS OTP. Please check mobile number.');
  }
};

module.exports = sendSms;
