const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ALL_CAMPUSES } = require('../utils/nitpLocations');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    userType: {
      type: String,
      enum: ['student', 'seller', 'external'],
      default: 'student',
    },
    campus: {
      type: String,
      required: [true, 'Please select your campus location'],
      enum: ALL_CAMPUSES,
      default: 'Patna Campus',
    },
    hostel: {
      type: String,
      trim: true,
      default: 'Campus Seller / Day Scholar',
    },
    // Keep hostelName as alias/fallback for backward compatibility with existing records
    hostelName: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide your mobile number'],
      trim: true,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    },
    // Verification Status
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Email OTP Storage (Hashed)
    otpHash: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lastOtpSentAt: {
      type: Date,
      select: false,
    },
    // Phone OTP Storage (Hashed)
    phoneOtpHash: {
      type: String,
      select: false,
    },
    phoneOtpExpires: {
      type: Date,
      select: false,
    },
    phoneOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lastPhoneOtpSentAt: {
      type: Date,
      select: false,
    },
    // Seller Monthly Subscription Fields (₹1,000 / month)
    subscriptionStatus: {
      type: String,
      enum: ['none', 'pending', 'active', 'expired', 'rejected'],
      default: function () {
        return this.userType === 'seller' ? 'none' : 'active';
      },
      index: true,
    },
    subscriptionFee: {
      type: Number,
      default: 1000,
    },
    subscriptionPaymentRef: {
      type: String,
      trim: true,
    },
    subscriptionPaymentDate: {
      type: Date,
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    subscriptionVerifiedAt: {
      type: Date,
    },
    subscriptionVerifiedBy: {
      type: String,
      default: 'campusbazzar4@gmail.com',
    },
    subscriptionRejectionReason: {
      type: String,
    },
    verificationToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Sync hostel and hostelName for backward compatibility
  if (this.hostel && !this.hostelName) {
    this.hostelName = this.hostel;
  } else if (this.hostelName && !this.hostel) {
    this.hostel = this.hostelName;
  }

  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
