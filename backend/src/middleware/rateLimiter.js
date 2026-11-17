/**
 * In-memory IP rate limiter for OTP endpoints
 * Keeps track of requests per IP with sliding window to prevent brute force.
 */
const rateLimitMap = new Map();

// Auto cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

const createOtpRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 5, message = 'Too many attempts. Please try again later.' }) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const waitMinutes = Math.ceil((record.resetTime - now) / 60000);
      return res.status(429).json({
        message: `${message} Try again in ${waitMinutes} minute(s).`,
      });
    }

    next();
  };
};

module.exports = {
  otpRateLimiter: createOtpRateLimiter({ windowMs: 10 * 60 * 1000, max: 6, message: 'Too many OTP requests from this device.' }),
  verifyRateLimiter: createOtpRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many verification attempts.' }),
};
