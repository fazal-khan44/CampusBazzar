const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['forgot_password', 'change_password', 'verify_account'],
      default: 'forgot_password',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-delete expired OTPs
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Otp', otpSchema);
