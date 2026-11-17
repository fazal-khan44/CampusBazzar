const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 1000,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'captured',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay',
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    userPhone: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
      default: 'CampusBazzar Seller Monthly Subscription (₹1,000 / month)',
    },
    rawDetails: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
