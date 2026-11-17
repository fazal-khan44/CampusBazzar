const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Payment = require('../models/Payment');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');
const { isDisposableEmail, isValidIndianMobile } = require('../utils/disposableEmails');
const { isValidCampus, isValidHostel } = require('../utils/nitpLocations');

// Helper to hash OTP for secure zero-leak storage
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
};

// Generate cryptographically secure 6-digit numeric OTP
const generateOtpCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Helper to check if email has valid generic format
const isValidEmailFormat = (email) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim());
};

// Helper to check if NITP college email format
const isValidNITPEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@nitp\.ac\.in$/i.test(email.trim());
};

// @desc    Register a new user (Requires email OTP verification)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      campus,
      hostel,
      hostelName,
      roomNumber,
      phoneNumber,
      userType,
      avatar,
      subscriptionPaymentRef,
      paymentId,
      orderId,
      paymentVerificationToken,
      paymentMethod,
    } = req.body;

    const resolvedCampus = campus || 'Patna Campus';
    const resolvedHostel = hostel || hostelName || 'Campus Seller / Day Scholar';
    const isSeller = userType === 'seller';

    if (!name || !email || !password || !resolvedCampus || !phoneNumber) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, password, campus location, and mobile number',
      });
    }

    // Verify Payment for Sellers
    let isGatewayVerified = false;
    let verifiedPaymentId = paymentId || subscriptionPaymentRef || '';

    if (isSeller) {
      if (paymentVerificationToken) {
        try {
          const secret = process.env.JWT_SECRET || 'cb_payment_secret_2026';
          const decoded = jwt.verify(paymentVerificationToken, secret);
          if (decoded && decoded.verified && decoded.amount === 1000) {
            isGatewayVerified = true;
            verifiedPaymentId = decoded.paymentId || verifiedPaymentId;
          }
        } catch (jwtErr) {
          return res.status(400).json({
            message: 'Payment verification failed: token is invalid or expired. Please re-initiate payment.',
          });
        }
      }

      if (!isGatewayVerified && (!subscriptionPaymentRef || !subscriptionPaymentRef.trim())) {
        return res.status(400).json({
          message:
            'Seller registration requires a verified monthly subscription fee of ₹1,000. Please complete the payment gateway transaction before registering.',
        });
      }
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isValidEmailFormat(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Security Check: Block temporary/disposable email services
    if (isDisposableEmail(cleanEmail)) {
      return res.status(400).json({
        message: 'Disposable or temporary email services are not permitted. Please use your genuine email.',
      });
    }

    // Security Check: Enforce valid Indian mobile number
    if (!isValidIndianMobile(phoneNumber)) {
      return res.status(400).json({
        message: 'Please provide a valid 10-digit Indian mobile number (e.g. 9876543210).',
      });
    }

    if (!isValidCampus(resolvedCampus)) {
      return res.status(400).json({
        message: 'Invalid campus selected. Choose Patna Campus or Bihta Campus',
      });
    }

    const isNitp = isValidNITPEmail(cleanEmail);

    // Enforce @nitp.ac.in for NITP students
    if (userType === 'student' && !isNitp) {
      return res.status(400).json({
        message: 'NIT Patna student accounts require an official college email (@nitp.ac.in).',
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      if (userExists.userType === 'seller') {
        if (userExists.subscriptionStatus === 'pending') {
          return res.status(400).json({
            message: 'A seller account with this email already exists and is pending verification by admin campusbazzar4@gmail.com. Once verified, you will be able to log in.',
          });
        }
        if (userExists.subscriptionStatus === 'active') {
          return res.status(400).json({
            message: 'An active seller account with this email already exists. Please sign in.',
          });
        }
        if (userExists.subscriptionStatus === 'rejected') {
          return res.status(400).json({
            message: `Your previous subscription payment was rejected: ${userExists.subscriptionRejectionReason || 'Invalid reference'}. Please log in to re-submit your ₹1,000 payment details.`,
          });
        }
      }

      // If student exists but is unverified, allow resending verification OTP
      if (!userExists.isEmailVerified) {
        const otp = generateOtpCode();
        userExists.otpHash = hashOtp(otp);
        userExists.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        userExists.otpAttempts = 0;
        userExists.lastOtpSentAt = new Date();
        await userExists.save();

        await sendEmail({
          to: cleanEmail,
          subject: 'Verify your CampusBazzar Account - OTP',
          html: `<div style="font-family:sans-serif;padding:20px;max-width:500px;border:1px solid #e2e8f0;border-radius:16px;">
            <h2 style="color:#1E2A3A;">Welcome to CampusBazzar</h2>
            <p>Your 6-digit email verification code is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#F27A1A;padding:12px 0;">${otp}</div>
            <p style="color:#64748b;font-size:13px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
          </div>`,
          text: `Your CampusBazzar email verification code is: ${otp}. Valid for 10 minutes.`,
        });

        return res.status(200).json({
          success: true,
          isEmailVerified: false,
          email: userExists.email,
          message: 'An unverified account exists with this email. A fresh verification code has been dispatched to your inbox.',
        });
      }
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    if (isSeller) {
      if (isGatewayVerified) {
        // Gateway payment verified: Activate seller account directly
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

        const sellerUser = await User.create({
          name,
          email: cleanEmail,
          password,
          userType: 'seller',
          campus: resolvedCampus,
          hostel: resolvedHostel,
          hostelName: resolvedHostel,
          roomNumber: 'N/A',
          phoneNumber,
          isEmailVerified: true,
          isPhoneVerified: false,
          subscriptionStatus: 'active',
          subscriptionFee: 1000,
          subscriptionPaymentRef: verifiedPaymentId,
          subscriptionPaymentDate: new Date(),
          subscriptionExpiresAt: expiresAt,
          subscriptionVerifiedAt: new Date(),
          subscriptionVerifiedBy: 'Payment Gateway (Instant Verification)',
          ...(avatar ? { avatar } : {}),
        });

        // Link payment record if exists
        await Payment.findOneAndUpdate(
          { paymentId: verifiedPaymentId },
          { userId: sellerUser._id, userEmail: cleanEmail, userName: name, userPhone: phoneNumber }
        );

        const adminEmail = process.env.EMAIL_USER || 'campusbazzar4@gmail.com';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // 1. Send Instant Invoice Receipt to Seller
        try {
          await sendEmail({
            to: cleanEmail,
            subject: `CampusBazzar Payment Receipt: ₹1,000 Monthly Seller Subscription Active`,
            html: `
              <div style="font-family:sans-serif;padding:24px;max-width:560px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
                <div style="background:#16A34A;padding:16px 20px;border-radius:12px;margin-bottom:20px;color:#ffffff;">
                  <h2 style="margin:0;font-size:20px;">Payment Verified & Active!</h2>
                  <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">CampusBazzar Seller Monthly Subscription</p>
                </div>
                <p style="font-size:14px;color:#334155;">Hello <strong>${name}</strong>, your payment of <strong>₹1,000</strong> has been verified successfully. Your seller account is active and you can start listing products right away.</p>
                
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:18px 0;">
                  <table style="width:100%;font-size:13px;border-collapse:collapse;">
                    <tr><td style="padding:5px 0;color:#64748B;">Transaction / Payment ID:</td><td style="padding:5px 0;color:#0F172A;font-weight:bold;font-family:monospace;">${verifiedPaymentId}</td></tr>
                    <tr><td style="padding:5px 0;color:#64748B;">Amount Paid:</td><td style="padding:5px 0;color:#16A34A;font-weight:bold;font-size:15px;">₹1,000</td></tr>
                    <tr><td style="padding:5px 0;color:#64748B;">Payment Method:</td><td style="padding:5px 0;color:#0F172A;">${paymentMethod || 'Razorpay / Payment Gateway'}</td></tr>
                    <tr><td style="padding:5px 0;color:#64748B;">Status:</td><td style="padding:5px 0;color:#16A34A;font-weight:bold;">Active (30 Days)</td></tr>
                    <tr><td style="padding:5px 0;color:#64748B;">Subscription Valid Until:</td><td style="padding:5px 0;color:#0F172A;font-weight:600;">${expiresAt.toDateString()}</td></tr>
                  </table>
                </div>

                <div style="margin:20px 0;">
                  <a href="${frontendUrl}/my-listings" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:14px;">Go to My Listings & Sell</a>
                </div>
                <p style="color:#94A3B8;font-size:11px;margin-top:20px;border-top:1px solid #E2E8F0;padding-top:10px;">Support: campusbazzar4@gmail.com</p>
              </div>
            `,
            text: `Payment verified! ₹1,000 seller subscription active for ${name}. Payment ID: ${verifiedPaymentId}. Valid until ${expiresAt.toDateString()}.`,
          });
        } catch (emailErr) {
          console.warn('Seller receipt email dispatch warning (non-fatal):', emailErr.message);
        }

        // 2. Notify Admin campusbazzar4@gmail.com
        try {
          await sendEmail({
            to: adminEmail,
            subject: `💰 [PAYMENT VERIFIED] ₹1,000 Seller Subscription Received: ${name}`,
            html: `
              <div style="font-family:sans-serif;padding:20px;max-width:550px;border:1px solid #e2e8f0;border-radius:16px;">
                <h3 style="color:#1E293B;margin-top:0;">Payment Gateway Alert</h3>
                <p style="font-size:14px;color:#334155;">A new campus seller completed payment verification via Payment Gateway:</p>
                <div style="background:#F1F5F9;padding:14px;border-radius:10px;font-size:13px;line-height:1.6;">
                  <strong>Seller:</strong> ${name} (${cleanEmail})<br/>
                  <strong>Mobile:</strong> +91 ${phoneNumber}<br/>
                  <strong>Campus:</strong> ${resolvedCampus} (${resolvedHostel})<br/>
                  <strong>Amount:</strong> <span style="color:#16A34A;font-weight:bold;">₹1,000</span><br/>
                  <strong>Payment ID:</strong> <span style="font-family:monospace;">${verifiedPaymentId}</span><br/>
                  <strong>Valid Until:</strong> ${expiresAt.toDateString()}
                </div>
              </div>
            `,
            text: `Payment Gateway: ₹1,000 subscription received from ${name} (${cleanEmail}, Ph: ${phoneNumber}). Payment ID: ${verifiedPaymentId}.`,
          });
        } catch (adminEmailErr) {
          console.warn('Admin payment notification email warning (non-fatal):', adminEmailErr.message);
        }

        const token = generateToken(sellerUser._id);

        return res.status(201).json({
          success: true,
          isSeller: true,
          subscriptionStatus: 'active',
          _id: sellerUser._id,
          name: sellerUser.name,
          email: sellerUser.email,
          userType: sellerUser.userType,
          campus: sellerUser.campus,
          hostel: sellerUser.hostel,
          hostelName: sellerUser.hostelName,
          roomNumber: sellerUser.roomNumber,
          phoneNumber: sellerUser.phoneNumber,
          avatar: sellerUser.avatar,
          isEmailVerified: true,
          isPhoneVerified: sellerUser.isPhoneVerified,
          subscriptionExpiresAt: sellerUser.subscriptionExpiresAt,
          subscriptionPaymentRef: verifiedPaymentId,
          token,
          message: 'Payment verified! Seller account registered and activated successfully. Welcome to CampusBazzar!',
        });
      }

      // Fallback: Legacy manual UTR submission
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const cleanPaymentRef = (subscriptionPaymentRef || verifiedPaymentId || '').trim();

      const sellerUser = await User.create({
        name,
        email: cleanEmail,
        password,
        userType: 'seller',
        campus: resolvedCampus,
        hostel: resolvedHostel,
        hostelName: resolvedHostel,
        roomNumber: 'N/A',
        phoneNumber,
        isEmailVerified: true,
        isPhoneVerified: false,
        subscriptionStatus: 'pending',
        subscriptionFee: 1000,
        subscriptionPaymentRef: cleanPaymentRef,
        subscriptionPaymentDate: new Date(),
        verificationToken,
        ...(avatar ? { avatar } : {}),
      });

      const adminEmail = process.env.EMAIL_USER || 'campusbazzar4@gmail.com';
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const approveLink = `${backendUrl}/api/auth/admin/verify-subscription?token=${verificationToken}&action=approve`;
      const rejectLink = `${backendUrl}/api/auth/admin/verify-subscription?token=${verificationToken}&action=reject`;

      // 1. Notify Admin campusbazzar4@gmail.com
      await sendEmail({
        to: adminEmail,
        subject: `🔔 [NEW SELLER] ₹1,000 Subscription Payment Verification Required: ${name}`,
        html: `
          <div style="font-family:sans-serif;padding:24px;max-width:600px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
            <div style="background:#1E293B;padding:16px 20px;border-radius:12px;margin-bottom:20px;">
              <h2 style="color:#ffffff;margin:0;font-size:20px;">CampusBazzar Admin Alert</h2>
              <p style="color:#94A3B8;margin:4px 0 0;font-size:13px;">New Seller Monthly Subscription Payment Verification</p>
            </div>
            <p style="font-size:15px;color:#334155;">A new campus seller has registered and submitted their <strong>₹1,000 Monthly Subscription</strong> payment.</p>
            
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:20px 0;">
              <table style="width:100%;font-size:14px;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Seller Name:</td><td style="padding:6px 0;color:#0F172A;font-weight:bold;">${name}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Email:</td><td style="padding:6px 0;color:#0F172A;">${cleanEmail}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Mobile:</td><td style="padding:6px 0;color:#0F172A;">+91 ${phoneNumber}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Campus:</td><td style="padding:6px 0;color:#0F172A;">${resolvedCampus}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Base / Hostel:</td><td style="padding:6px 0;color:#0F172A;">${resolvedHostel}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Subscription Fee:</td><td style="padding:6px 0;color:#16A34A;font-weight:bold;font-size:16px;">₹1,000 / month</td></tr>
                <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Transaction / UTR ID:</td><td style="padding:6px 0;color:#D97706;font-weight:bold;font-size:16px;background:#FEF3C7;padding:4px 8px;border-radius:6px;display:inline-block;">${cleanPaymentRef}</td></tr>
              </table>
            </div>

            <p style="font-size:14px;color:#475569;margin-bottom:20px;">
              Please verify the <strong>₹1,000</strong> payment in your UPI / Bank statement for reference <strong>${cleanPaymentRef}</strong>, then select an action below:
            </p>

            <div style="margin:24px 0;">
              <a href="${approveLink}" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:14px;margin-right:12px;">✅ Approve & Activate Seller</a>
              <a href="${rejectLink}" style="display:inline-block;padding:12px 24px;background:#DC2626;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:14px;">❌ Reject Payment</a>
            </div>

            <p style="color:#94A3B8;font-size:12px;margin-top:24px;border-top:1px solid #E2E8F0;padding-top:12px;">
              Manage all subscriptions anytime from the admin panel: <a href="${frontendUrl}/admin/subscriptions" style="color:#4F46E5;">${frontendUrl}/admin/subscriptions</a>
            </p>
          </div>
        `,
        text: `New seller ${name} (${cleanEmail}, Ph: ${phoneNumber}) submitted ₹1,000 subscription payment with UTR: ${cleanPaymentRef}. Approve: ${approveLink} | Reject: ${rejectLink}`,
      });

      // 2. Notify Seller
      await sendEmail({
        to: cleanEmail,
        subject: `CampusBazzar - ₹1,000 Seller Subscription Payment Received (Under Review)`,
        html: `
          <div style="font-family:sans-serif;padding:24px;max-width:550px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
            <h2 style="color:#1E2A3A;margin-top:0;">Welcome to CampusBazzar, ${name}!</h2>
            <p style="color:#475569;font-size:14px;">We have received your registration details and ₹1,000 monthly subscription payment submission.</p>
            
            <div style="background:#F1F5F9;border-radius:12px;padding:14px;margin:16px 0;font-size:13px;">
              <p style="margin:4px 0;"><strong>Subscription Plan:</strong> Monthly Campus Seller (₹1,000 / month)</p>
              <p style="margin:4px 0;"><strong>Transaction / UTR ID:</strong> ${cleanPaymentRef}</p>
              <p style="margin:4px 0;"><strong>Status:</strong> <span style="color:#D97706;font-weight:bold;">Pending Admin Verification</span></p>
            </div>

            <p style="color:#475569;font-size:14px;line-height:1.5;">
              Our platform administrator (<strong>campusbazzar4@gmail.com</strong>) is verifying your payment with our bank statement. Once verified, you will receive an activation email and you will be able to log in and sell products.
            </p>

            <p style="color:#64748B;font-size:12px;margin-top:20px;border-top:1px solid #E2E8F0;padding-top:12px;">
              Questions? Contact campusbazzar4@gmail.com.
            </p>
          </div>
        `,
        text: `Hello ${name}, your ₹1,000 monthly seller subscription payment (UTR: ${cleanPaymentRef}) has been received and is awaiting verification by admin campusbazzar4@gmail.com. You will be able to login once approved.`,
      });

      return res.status(201).json({
        success: true,
        isSeller: true,
        subscriptionStatus: 'pending',
        email: sellerUser.email,
        paymentRef: cleanPaymentRef,
        message: 'Seller account registered! Your ₹1,000 monthly subscription payment has been submitted for admin verification. Once verified by campusbazzar4@gmail.com, you will be able to log in.',
      });
    }

    // Student Registration: Email OTP
    const otp = generateOtpCode();
    const otpHash = hashOtp(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      userType: userType || (isNitp ? 'student' : 'seller'),
      campus: resolvedCampus,
      hostel: resolvedHostel,
      hostelName: resolvedHostel,
      roomNumber: roomNumber || 'N/A',
      phoneNumber,
      isEmailVerified: false,
      isPhoneVerified: false,
      otpHash,
      otpExpires,
      otpAttempts: 0,
      lastOtpSentAt: new Date(),
      subscriptionStatus: 'active',
      subscriptionFee: 0,
      ...(avatar ? { avatar } : {}),
    });

    // Dispatch verification email
    await sendEmail({
      to: cleanEmail,
      subject: 'Verify your CampusBazzar Account - OTP',
      html: `<div style="font-family:sans-serif;padding:20px;max-width:500px;border:1px solid #e2e8f0;border-radius:16px;">
        <h2 style="color:#1E2A3A;">Welcome to CampusBazzar, ${name}!</h2>
        <p>Please enter this 6-digit verification code to activate your account:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#F27A1A;padding:12px 0;">${otp}</div>
        <p style="color:#64748b;font-size:13px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
      </div>`,
      text: `Your CampusBazzar email verification code is: ${otp}. Valid for 10 minutes.`,
    });

    res.status(201).json({
      success: true,
      isEmailVerified: false,
      email: user.email,
      message: 'Account created! Please enter the 6-digit verification code sent to your email to activate your account.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Blocks unverified users)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isValidEmailFormat(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Security Check: Block unverified students
    if (!user.isEmailVerified && user.userType !== 'seller') {
      return res.status(403).json({
        message: 'Your email address is not verified yet. Please enter the verification code sent to your email to continue.',
        isEmailVerified: false,
        email: user.email,
      });
    }

    // Security & Subscription Check: Only allow sellers after admin campusbazzar4@gmail.com verifies payment
    if (user.userType === 'seller') {
      // Auto-expire subscription if past expiry date
      if (
        user.subscriptionStatus === 'active' &&
        user.subscriptionExpiresAt &&
        Date.now() > new Date(user.subscriptionExpiresAt).getTime()
      ) {
        user.subscriptionStatus = 'expired';
        await user.save();
      }

      if (user.subscriptionStatus === 'pending' || user.subscriptionStatus === 'none' || !user.subscriptionStatus) {
        return res.status(403).json({
          message: 'Your seller account is awaiting subscription verification. Our admin (campusbazzar4@gmail.com) is currently verifying your ₹1,000 monthly subscription payment. Once verified, you will be able to log in.',
          subscriptionStatus: 'pending',
          sellerEmail: user.email,
          paymentRef: user.subscriptionPaymentRef,
        });
      }

      if (user.subscriptionStatus === 'rejected') {
        return res.status(403).json({
          message: `Your subscription payment could not be verified by admin: ${user.subscriptionRejectionReason || 'Invalid transaction/UTR reference'}. Please re-submit your valid ₹1,000 payment details.`,
          subscriptionStatus: 'rejected',
          sellerEmail: user.email,
          paymentRef: user.subscriptionPaymentRef,
        });
      }

      if (user.subscriptionStatus === 'expired') {
        return res.status(403).json({
          message: 'Your monthly seller subscription of ₹1,000 has expired. Please renew your subscription to log in.',
          subscriptionStatus: 'expired',
          sellerEmail: user.email,
        });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType || 'student',
      campus: user.campus || 'Patna Campus',
      hostel: user.hostel || user.hostelName || 'Brahmaputra Hostel',
      hostelName: user.hostel || user.hostelName || 'Brahmaputra Hostel',
      roomNumber: user.roomNumber || 'N/A',
      phoneNumber: user.phoneNumber || '',
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with 6-digit OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits.' });
    }

    const user = await User.findOne({ email: cleanEmail }).select(
      '+otpHash +otpExpires +otpAttempts'
    );

    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email.' });
    }

    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Email address is already verified! Please sign in.',
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        campus: user.campus,
        hostel: user.hostel,
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        isEmailVerified: true,
        isPhoneVerified: user.isPhoneVerified,
        token: generateToken(user._id),
      });
    }

    // Security: Max 5 attempts
    if (user.otpAttempts >= 5) {
      return res.status(400).json({
        message: 'Maximum verification attempts exceeded (5 tries). Please click "Resend Code" to receive a new OTP.',
      });
    }

    // Security: 10-minute expiry
    if (!user.otpExpires || Date.now() > user.otpExpires.getTime()) {
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Security: Constant-time or strict SHA-256 comparison
    const enteredHash = hashOtp(cleanOtp);
    if (enteredHash !== user.otpHash) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({
        message: `Invalid code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`,
      });
    }

    // Verification successful: Activate account & clear OTP
    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to CampusBazzar.',
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      campus: user.campus,
      hostel: user.hostel,
      hostelName: user.hostelName,
      roomNumber: user.roomNumber,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      isEmailVerified: true,
      isPhoneVerified: user.isPhoneVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Email Verification OTP with 60-second cooldown
// @route   POST /api/auth/resend-otp
// @access  Public
const resendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+lastOtpSentAt');

    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'This email is already verified. Please sign in.' });
    }

    // Security: 60-second cooldown
    if (user.lastOtpSentAt) {
      const timeDiff = Date.now() - user.lastOtpSentAt.getTime();
      if (timeDiff < 60 * 1000) {
        const waitSecs = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          message: `Please wait ${waitSecs} second(s) before requesting a new code.`,
          cooldownRemaining: waitSecs,
        });
      }
    }

    // Generate new OTP & update
    const otp = generateOtpCode();
    user.otpHash = hashOtp(otp);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.lastOtpSentAt = new Date();
    await user.save();

    await sendEmail({
      to: cleanEmail,
      subject: 'New Verification Code - CampusBazzar',
      html: `<div style="font-family:sans-serif;padding:20px;max-width:500px;border:1px solid #e2e8f0;border-radius:16px;">
        <h2 style="color:#1E2A3A;">CampusBazzar Verification Code</h2>
        <p>Here is your new 6-digit email verification code:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#F27A1A;padding:12px 0;">${otp}</div>
        <p style="color:#64748b;font-size:13px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
      </div>`,
      text: `Your CampusBazzar email verification code is: ${otp}. Valid for 10 minutes.`,
    });

    res.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Phone Verification OTP (pluggable sendSms)
// @route   POST /api/auth/send-phone-otp
// @access  Private
const sendPhoneOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+lastPhoneOtpSentAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const phoneToVerify = req.body.phoneNumber || user.phoneNumber;

    if (!isValidIndianMobile(phoneToVerify)) {
      return res.status(400).json({
        message: 'Please provide a valid 10-digit Indian mobile number.',
      });
    }

    // Security: 60-second cooldown
    if (user.lastPhoneOtpSentAt) {
      const timeDiff = Date.now() - user.lastPhoneOtpSentAt.getTime();
      if (timeDiff < 60 * 1000) {
        const waitSecs = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          message: `Please wait ${waitSecs} second(s) before requesting another SMS OTP.`,
          cooldownRemaining: waitSecs,
        });
      }
    }

    const otp = generateOtpCode();
    user.phoneOtpHash = hashOtp(otp);
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.phoneOtpAttempts = 0;
    user.lastPhoneOtpSentAt = new Date();
    if (req.body.phoneNumber) {
      user.phoneNumber = req.body.phoneNumber.toString().trim();
    }
    await user.save();

    await sendSms({
      to: user.phoneNumber,
      message: `Your CampusBazzar phone verification code is: ${otp}. Valid for 10 minutes.`,
    });

    res.json({
      success: true,
      message: `Verification code sent to your phone number (+91 ${user.phoneNumber.slice(-10)}).`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Phone with 6-digit OTP
// @route   POST /api/auth/verify-phone
// @access  Private
const verifyPhone = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'Please provide the 6-digit OTP code.' });
    }

    const cleanOtp = otp.toString().trim();
    const user = await User.findById(req.user._id).select(
      '+phoneOtpHash +phoneOtpExpires +phoneOtpAttempts'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isPhoneVerified) {
      return res.json({ success: true, message: 'Phone number is already verified.' });
    }

    // Security: Max 5 attempts
    if (user.phoneOtpAttempts >= 5) {
      return res.status(400).json({
        message: 'Maximum attempts exceeded (5 tries). Please request a new phone OTP.',
      });
    }

    // Security: 10-minute expiry
    if (!user.phoneOtpExpires || Date.now() > user.phoneOtpExpires.getTime()) {
      return res.status(400).json({
        message: 'Phone verification code has expired. Please request a new code.',
      });
    }

    if (hashOtp(cleanOtp) !== user.phoneOtpHash) {
      user.phoneOtpAttempts = (user.phoneOtpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.phoneOtpAttempts;
      return res.status(400).json({
        message: `Invalid code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`,
      });
    }

    user.isPhoneVerified = true;
    user.phoneOtpHash = undefined;
    user.phoneOtpExpires = undefined;
    user.phoneOtpAttempts = 0;
    await user.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully! You now have the Phone Verified badge.',
      isPhoneVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick NITP College Email Sign-in (Restricted strictly to @nitp.ac.in)
// @route   POST /api/auth/nitp-direct
// @access  Public
const directNITPSignIn = async (req, res, next) => {
  try {
    const { email, password, name, campus, hostel, hostelName, roomNumber, phoneNumber, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'College email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // STRICT CHECK: Only @nitp.ac.in accepted
    if (!isValidNITPEmail(cleanEmail)) {
      return res.status(400).json({
        message: 'NITP Direct requires an official NIT Patna student or faculty email address (@nitp.ac.in).',
      });
    }

    const resolvedCampus = campus || 'Patna Campus';
    const resolvedHostel = hostel || hostelName || 'Brahmaputra Hostel';

    if (!isValidCampus(resolvedCampus)) {
      return res.status(400).json({ message: 'Invalid campus selected' });
    }

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const prefix = cleanEmail.split('@')[0];
      const fallbackName = name || prefix.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const otp = generateOtpCode();

      user = await User.create({
        name: fallbackName,
        email: cleanEmail,
        password: password || Math.random().toString(36).slice(-10) + 'Aa1!',
        userType: 'student',
        campus: resolvedCampus,
        hostel: resolvedHostel,
        hostelName: resolvedHostel,
        roomNumber: roomNumber || '101',
        phoneNumber: phoneNumber || '9876543210',
        isEmailVerified: false,
        isPhoneVerified: false,
        otpHash: hashOtp(otp),
        otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        otpAttempts: 0,
        lastOtpSentAt: new Date(),
        ...(avatar ? { avatar } : {}),
      });

      await sendEmail({
        to: cleanEmail,
        subject: 'Verify your NITP Account - CampusBazzar',
        html: `<h2>Welcome to CampusBazzar NITP</h2><p>Your 6-digit verification code is:</p><h1 style="letter-spacing:4px;color:#F27A1A;">${otp}</h1><p>Valid for 10 minutes.</p>`,
        text: `Your CampusBazzar verification code is: ${otp}. Valid for 10 minutes.`,
      });

      return res.status(201).json({
        success: true,
        isEmailVerified: false,
        email: user.email,
        message: 'Account created! Please verify your @nitp.ac.in email using the 6-digit OTP code sent to your inbox.',
      });
    }

    // If user exists but is unverified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Your @nitp.ac.in email is not verified yet. Please enter the OTP sent to your email.',
        isEmailVerified: false,
        email: user.email,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType || 'student',
      campus: user.campus || 'Patna Campus',
      hostel: user.hostel || user.hostelName || 'Brahmaputra Hostel',
      hostelName: user.hostel || user.hostelName || 'Brahmaputra Hostel',
      roomNumber: user.roomNumber || '101',
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using registered Email & Phone Number verification
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email, phoneNumber, newPassword } = req.body;

    if (!email || !phoneNumber || !newPassword) {
      return res.status(400).json({
        message: 'Please provide your registered email, mobile number, and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address',
      });
    }

    // Verify phone number (compare last 10 digits)
    const userPhoneClean = (user.phoneNumber || '').replace(/[^0-9]/g, '');
    const userLast10 = userPhoneClean.slice(-10);
    const inputLast10 = cleanPhone.slice(-10);

    if (!userLast10 || userLast10 !== inputLast10) {
      return res.status(400).json({
        message: 'Mobile number does not match our records for this account',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (Name, Avatar, Campus, Hostel, Room, Phone)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, avatar, campus, hostel, hostelName, roomNumber, phoneNumber } = req.body;

    if (name && name.trim()) user.name = name.trim();
    if (avatar && avatar.trim()) user.avatar = avatar.trim();
    if (campus && isValidCampus(campus)) user.campus = campus;
    if (hostel || hostelName) {
      const resolvedHostel = hostel || hostelName;
      user.hostel = resolvedHostel;
      user.hostelName = resolvedHostel;
    }
    if (roomNumber !== undefined) user.roomNumber = roomNumber;
    if (phoneNumber && phoneNumber.trim()) user.phoneNumber = phoneNumber.trim();

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType || 'student',
      campus: user.campus || 'Patna Campus',
      hostel: user.hostel || user.hostelName || 'Brahmaputra Hostel',
      hostelName: user.hostel || user.hostelName || 'Brahmaputra Hostel',
      roomNumber: user.roomNumber || 'N/A',
      phoneNumber: user.phoneNumber || '',
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to email or phone number for password reset or change
// @route   POST /api/auth/send-otp
// @access  Public (or Private for change_password)
const sendOtp = async (req, res, next) => {
  try {
    const { identifier, purpose = 'forgot_password' } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Please provide an email address or mobile number' });
    }

    const raw = identifier.trim();
    const isEmail = raw.includes('@');
    const cleanIdentifier = isEmail ? raw.toLowerCase() : raw.replace(/[^0-9]/g, '').slice(-10);

    if (isEmail && !isValidEmailFormat(cleanIdentifier)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!isEmail && cleanIdentifier.length !== 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
    }

    // If purpose is forgot_password, check if user exists
    if (purpose === 'forgot_password') {
      let user;
      if (isEmail) {
        user = await User.findOne({ email: cleanIdentifier });
      } else {
        const allUsers = await User.find({}, 'phoneNumber');
        user = allUsers.find((u) => {
          const uPhone = (u.phoneNumber || '').replace(/[^0-9]/g, '');
          return uPhone.slice(-10) === cleanIdentifier;
        });
      }

      if (!user) {
        return res.status(404).json({
          message: isEmail
            ? 'No registered account found with this email address'
            : 'No registered account found with this mobile number',
        });
      }
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove any existing OTP for this identifier and purpose
    await Otp.deleteMany({ identifier: cleanIdentifier, purpose });

    await Otp.create({
      identifier: cleanIdentifier,
      otp,
      purpose,
      expiresAt,
    });

    console.log(`[CAMPUSBAZZAR OTP] Generated OTP for ${cleanIdentifier} (${purpose}): ${otp}`);

    // If identifier is an email (or user has registered email), send real email via Nodemailer
    if (isEmail) {
      const subject = purpose === 'forgot_password'
        ? `CampusBazzar - Password Reset OTP Code: ${otp}`
        : `CampusBazzar Verification Code: ${otp}`;

      const htmlContent = `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:28px 24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">CampusBazzar</h1>
            <p style="color:#e0e7ff;margin:6px 0 0;font-size:13px;font-weight:500;">NIT Patna Campus Marketplace</p>
          </div>
          <div style="padding:32px 28px;">
            <h2 style="color:#1e293b;font-size:19px;font-weight:700;margin:0 0 12px;">Password Reset Request</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
              We received a request to reset your password for your account (<strong>${cleanIdentifier}</strong>). Use the one-time verification code below to reset your password:
            </p>
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;background:#f8fafc;border:2px dashed #6366f1;border-radius:14px;padding:14px 28px;font-size:32px;font-weight:800;letter-spacing:8px;color:#4f46e5;font-family:monospace;">
                ${otp}
              </div>
            </div>
            <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0 0 20px;text-align:center;">
              ⏱️ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
            <div style="background:#f1f5f9;border-radius:12px;padding:12px 16px;color:#64748b;font-size:12px;line-height:1.5;">
              If you didn't request a password reset, you can safely ignore this email. Your current password will remain unchanged.
            </div>
          </div>
          <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
            National Institute of Technology Patna &bull; CampusBazzar Security Team
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: cleanIdentifier,
          subject,
          html: htmlContent,
          text: `Your CampusBazzar password reset code is: ${otp}. It is valid for 10 minutes. Do not share this code with anyone.`,
        });
      } catch (emailErr) {
        console.error('[sendOtp] Failed to deliver email:', emailErr.message);
        return res.status(500).json({
          message: 'Failed to deliver OTP to your email. Please check your email address or try again in a few moments.',
        });
      }
    } else if (process.env.SMS_API_KEY) {
      try {
        await sendSms({
          to: cleanIdentifier,
          message: `Your CampusBazzar OTP code is: ${otp}. Valid for 10 minutes.`,
        });
      } catch (smsErr) {
        console.error('[sendOtp] Failed to send SMS:', smsErr.message);
      }
    }

    res.json({
      success: true,
      message: isEmail
        ? `A 6-digit password reset code has been sent to ${cleanIdentifier}. Please check your inbox (and spam folder).`
        : `OTP sent successfully to ******${cleanIdentifier.slice(-4)}! Valid for 10 minutes.`,
      identifier: cleanIdentifier,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp, purpose = 'forgot_password' } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    const raw = identifier.trim();
    const isEmail = raw.includes('@');
    const cleanIdentifier = isEmail ? raw.toLowerCase() : raw.replace(/[^0-9]/g, '').slice(-10);

    const record = await Otp.findOne({
      identifier: cleanIdentifier,
      otp: otp.trim(),
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again or request a new OTP.' });
    }

    res.json({ success: true, verified: true, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using OTP (at signin)
// @route   POST /api/auth/forgot-password-otp
// @access  Public
const forgotPasswordWithOtp = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Identifier, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const raw = identifier.trim();
    const isEmail = raw.includes('@');
    const cleanIdentifier = isEmail ? raw.toLowerCase() : raw.replace(/[^0-9]/g, '').slice(-10);

    // Verify OTP
    const record = await Otp.findOne({
      identifier: cleanIdentifier,
      otp: otp.trim(),
      purpose: 'forgot_password',
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find User
    let user;
    if (isEmail) {
      user = await User.findOne({ email: cleanIdentifier }).select('+password');
    } else {
      const allUsers = await User.find({}).select('+password');
      user = allUsers.find((u) => {
        const uPhone = (u.phoneNumber || '').replace(/[^0-9]/g, '');
        return uPhone.slice(-10) === cleanIdentifier;
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.password = newPassword;
    await user.save();

    // Consume OTP
    await Otp.deleteMany({ identifier: cleanIdentifier, purpose: 'forgot_password' });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password with OTP from Profile page
// @route   POST /api/auth/change-password-otp
// @access  Private
const changePasswordWithOtp = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'OTP and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const userEmail = req.user.email.toLowerCase().trim();
    const userPhoneClean = (req.user.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);

    // Check if OTP matches either email or phone
    const record = await Otp.findOne({
      identifier: { $in: [userEmail, userPhoneClean] },
      otp: otp.trim(),
      purpose: 'change_password',
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Consume OTP
    await Otp.deleteMany({ identifier: { $in: [userEmail, userPhoneClean] }, purpose: 'change_password' });

    res.json({
      success: true,
      message: 'Password changed successfully! Keep your new password safe.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin one-click verify/reject seller subscription via email link
// @route   GET /api/auth/admin/verify-subscription
// @access  Public (Secured with unique cryptographically random token)
const verifySubscriptionViaToken = async (req, res, next) => {
  try {
    const { token, action, reason } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>CampusBazzar - Invalid Request</title></head>
          <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;">
            <div style="background:#fff;padding:36px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.06);text-align:center;max-width:440px;border:1px solid #e2e8f0;">
              <h2 style="color:#ef4444;margin:0 0 10px;">Missing Verification Token</h2>
              <p style="color:#64748b;font-size:14px;">The verification link is missing or invalid.</p>
            </div>
          </body>
        </html>
      `);
    }

    const user = await User.findOne({ verificationToken: token, userType: 'seller' }).select('+verificationToken');

    if (!user) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>CampusBazzar - Link Expired</title></head>
          <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;">
            <div style="background:#fff;padding:36px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.06);text-align:center;max-width:440px;border:1px solid #e2e8f0;">
              <div style="font-size:36px;margin-bottom:12px;">ℹ️</div>
              <h2 style="color:#0f172a;margin:0 0 8px;">Already Verified or Expired</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.5;">This seller subscription link has already been processed or is no longer valid.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;">Go to CampusBazzar</a>
            </div>
          </body>
        </html>
      `);
    }

    const isApprove = action === 'approve';

    if (isApprove) {
      user.subscriptionStatus = 'active';
      user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days active
      user.subscriptionVerifiedAt = new Date();
      user.subscriptionVerifiedBy = 'campusbazzar4@gmail.com';
      user.isEmailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      // Notify seller via email
      await sendEmail({
        to: user.email,
        subject: '🎉 Congratulations! Your CampusBazzar Seller Subscription is Verified',
        html: `
          <div style="font-family:system-ui,sans-serif;padding:24px;max-width:550px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:12px;margin-bottom:16px;">
              <h2 style="color:#065f46;margin:0;font-size:20px;">Payment Verified Successfully!</h2>
              <p style="color:#047857;margin:4px 0 0;font-size:13px;">Your ₹1,000 Monthly Seller Subscription is Now Active</p>
            </div>
            <p style="color:#334155;font-size:14px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color:#334155;font-size:14px;line-height:1.6;">
              Administrator <strong>campusbazzar4@gmail.com</strong> has verified your ₹1,000 subscription payment (UTR: <strong>${user.subscriptionPaymentRef || 'N/A'}</strong>).
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;font-size:13px;margin:16px 0;">
              <p style="margin:3px 0;"><strong>Status:</strong> Active Seller</p>
              <p style="margin:3px 0;"><strong>Active Until:</strong> ${user.subscriptionExpiresAt.toLocaleDateString('en-IN')}</p>
            </div>
            <p style="color:#334155;font-size:14px;">You can now log in and begin listing and selling products across NIT Patna!</p>
            <div style="margin:20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:14px;">Sign In to CampusBazzar</a>
            </div>
          </div>
        `,
        text: `Hello ${user.name}, your ₹1,000 monthly seller subscription has been verified by admin campusbazzar4@gmail.com! You can now sign in at ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      });

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Seller Approved - CampusBazzar</title></head>
          <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;">
            <div style="background:#fff;padding:40px;border-radius:24px;box-shadow:0 12px 30px rgba(0,0,0,0.06);text-align:center;max-width:480px;border:1px solid #e2e8f0;">
              <div style="width:64px;height:64px;background:#dcfce7;color:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px;font-weight:bold;">✓</div>
              <h2 style="color:#0f172a;margin:0 0 8px;">Seller Subscription Approved!</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.5;margin-bottom:20px;">
                <strong>${user.name}</strong> (${user.email}) has been verified and granted 30 days of seller access. An activation email has been dispatched to the seller.
              </p>
              <div style="background:#f1f5f9;padding:12px;border-radius:12px;font-size:13px;color:#334155;margin-bottom:24px;">
                Amount: <strong>₹1,000</strong> • UTR: <strong>${user.subscriptionPaymentRef || 'N/A'}</strong>
              </div>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:13px;">Return to CampusBazzar</a>
            </div>
          </body>
        </html>
      `);
    } else {
      user.subscriptionStatus = 'rejected';
      user.subscriptionRejectionReason = reason || 'Payment transaction reference could not be verified in bank records';
      user.verificationToken = undefined;
      await user.save();

      // Notify seller of rejection
      await sendEmail({
        to: user.email,
        subject: 'CampusBazzar - Seller Subscription Payment Unsuccessful',
        html: `
          <div style="font-family:system-ui,sans-serif;padding:24px;max-width:550px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
            <h2 style="color:#dc2626;margin-top:0;">Payment Verification Unsuccessful</h2>
            <p style="color:#334155;font-size:14px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color:#334155;font-size:14px;line-height:1.6;">
              Our administrator (<strong>campusbazzar4@gmail.com</strong>) was unable to verify your ₹1,000 subscription payment with UTR <strong>${user.subscriptionPaymentRef || 'N/A'}</strong>.
            </p>
            <div style="background:#fef2f2;border:1px solid #fecaca;padding:14px;border-radius:12px;margin:16px 0;font-size:13px;color:#991b1b;">
              Reason: ${user.subscriptionRejectionReason}
            </div>
            <p style="color:#334155;font-size:14px;">
              Please ensure you paid ₹1,000 to UPI ID: <strong>campusbazzar4@gmail.com</strong> and re-submit your correct 12-digit UTR on the login page.
            </p>
          </div>
        `,
        text: `Hello ${user.name}, your ₹1,000 seller subscription payment could not be verified by admin campusbazzar4@gmail.com. Reason: ${user.subscriptionRejectionReason}. Please re-submit your correct UTR.`,
      });

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Subscription Rejected - CampusBazzar</title></head>
          <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;">
            <div style="background:#fff;padding:40px;border-radius:24px;box-shadow:0 12px 30px rgba(0,0,0,0.06);text-align:center;max-width:480px;border:1px solid #e2e8f0;">
              <div style="width:64px;height:64px;background:#fee2e2;color:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px;font-weight:bold;">✕</div>
              <h2 style="color:#0f172a;margin:0 0 8px;">Subscription Rejected</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.5;margin-bottom:20px;">
                <strong>${user.name}</strong> (${user.email}) subscription has been marked as rejected. An email has been sent requesting a valid payment reference.
              </p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:13px;">Return to CampusBazzar</a>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sellers for admin dashboard
// @route   GET /api/auth/admin/sellers
// @access  Private (Admin: campusbazzar4@gmail.com)
const getAdminSellers = async (req, res, next) => {
  try {
    if (req.user.email !== 'campusbazzar4@gmail.com') {
      return res.status(403).json({ message: 'Access denied: Admin campusbazzar4@gmail.com only.' });
    }

    const sellers = await User.find({ userType: 'seller' })
      .select('name email phoneNumber campus hostel roomNumber subscriptionStatus subscriptionFee subscriptionPaymentRef subscriptionPaymentDate subscriptionExpiresAt subscriptionVerifiedAt subscriptionRejectionReason createdAt')
      .sort({ createdAt: -1 });

    res.json(sellers);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin approve or reject seller subscription by ID
// @route   POST /api/auth/admin/verify-seller/:id
// @access  Private (Admin: campusbazzar4@gmail.com)
const verifySellerById = async (req, res, next) => {
  try {
    if (req.user.email !== 'campusbazzar4@gmail.com') {
      return res.status(403).json({ message: 'Access denied: Admin campusbazzar4@gmail.com only.' });
    }

    const { action, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.userType !== 'seller') {
      return res.status(404).json({ message: 'Seller account not found.' });
    }

    if (action === 'approve') {
      user.subscriptionStatus = 'active';
      user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      user.subscriptionVerifiedAt = new Date();
      user.subscriptionVerifiedBy = 'campusbazzar4@gmail.com';
      user.isEmailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      // Send email to seller
      await sendEmail({
        to: user.email,
        subject: '🎉 Congratulations! Your CampusBazzar Seller Subscription is Verified',
        html: `
          <div style="font-family:system-ui,sans-serif;padding:24px;max-width:550px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
            <h2 style="color:#16a34a;margin-top:0;">Payment Verified!</h2>
            <p style="color:#334155;font-size:15px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color:#334155;font-size:14px;line-height:1.6;">Your ₹1,000 monthly seller subscription has been verified by admin campusbazzar4@gmail.com. You can now log in and sell on CampusBazzar!</p>
            <div style="margin:20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:14px;">Sign In Now</a>
            </div>
          </div>
        `,
        text: `Your ₹1,000 monthly seller subscription has been verified by admin campusbazzar4@gmail.com! You can now log in at ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      });

      return res.json({ success: true, message: 'Seller subscription approved & activated for 30 days!', seller: user });
    } else {
      user.subscriptionStatus = 'rejected';
      user.subscriptionRejectionReason = reason || 'Payment transaction reference could not be verified';
      user.verificationToken = undefined;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'CampusBazzar - Seller Subscription Payment Unsuccessful',
        html: `
          <div style="font-family:system-ui,sans-serif;padding:24px;max-width:550px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
            <h2 style="color:#dc2626;margin-top:0;">Verification Unsuccessful</h2>
            <p style="color:#334155;font-size:14px;">Reason: ${user.subscriptionRejectionReason}</p>
            <p style="color:#334155;font-size:14px;">Please re-submit your ₹1,000 payment details with a valid UTR.</p>
          </div>
        `,
        text: `Your ₹1,000 seller subscription payment could not be verified. Reason: ${user.subscriptionRejectionReason}.`,
      });

      return res.json({ success: true, message: 'Seller subscription marked as rejected.', seller: user });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Seller re-submits subscription payment reference
// @route   POST /api/auth/seller/resubmit-payment
// @access  Public
const resubmitSellerPayment = async (req, res, next) => {
  try {
    const {
      email,
      password,
      subscriptionPaymentRef,
      paymentVerificationToken,
      paymentMethod,
    } = req.body;

    if (!email || !password || (!subscriptionPaymentRef && !paymentVerificationToken)) {
      return res.status(400).json({
        message: 'Email, password, and transaction reference or verified token are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail, userType: 'seller' }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid seller credentials.' });
    }

    // Instant Gateway Verification path
    if (paymentVerificationToken) {
      try {
        const secret = process.env.JWT_SECRET || 'cb_payment_secret_2026';
        const decoded = jwt.verify(paymentVerificationToken, secret);
        if (decoded && decoded.verified && decoded.amount === 1000) {
          const verifiedPaymentId = decoded.paymentId || subscriptionPaymentRef || 'pay_verified';
          user.subscriptionStatus = 'active';
          user.subscriptionPaymentRef = verifiedPaymentId;
          user.subscriptionPaymentDate = new Date();
          user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          user.subscriptionVerifiedAt = new Date();
          user.subscriptionVerifiedBy = `Payment Gateway (${paymentMethod || 'Razorpay'})`;
          user.subscriptionRejectionReason = undefined;
          await user.save();

          await Payment.findOneAndUpdate(
            { paymentId: verifiedPaymentId },
            { userId: user._id, userEmail: cleanEmail, userName: user.name, userPhone: user.phoneNumber }
          );

          return res.json({
            success: true,
            isDirectActive: true,
            message: 'Payment verified instantly via Gateway! Your seller subscription is now active for 30 days.',
          });
        }
      } catch (jwtErr) {
        console.warn('Resubmit payment token check fallback:', jwtErr.message);
      }
    }

    const cleanPaymentRef = (subscriptionPaymentRef || '').trim();
    user.subscriptionPaymentRef = cleanPaymentRef;
    user.subscriptionPaymentDate = new Date();
    user.subscriptionStatus = 'pending';
    user.subscriptionRejectionReason = undefined;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Alert Admin campusbazzar4@gmail.com
    const adminEmail = 'campusbazzar4@gmail.com';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const approveLink = `${backendUrl}/api/auth/admin/verify-subscription?token=${verificationToken}&action=approve`;
    const rejectLink = `${backendUrl}/api/auth/admin/verify-subscription?token=${verificationToken}&action=reject`;

    await sendEmail({
      to: adminEmail,
      subject: `🔔 [RESUBMITTED] Seller ₹1,000 Payment Verification: ${user.name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;padding:24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;max-width:550px;">
          <h2 style="color:#1e293b;margin-top:0;">Resubmitted Seller Subscription Payment</h2>
          <p style="color:#475569;font-size:14px;">Seller <strong>${user.name}</strong> (${user.email}, +91 ${user.phoneNumber}) has re-submitted their ₹1,000 payment details.</p>
          <div style="background:#f8fafc;padding:12px;border-radius:10px;margin:16px 0;font-size:13px;">
            <strong>New Transaction / UTR ID:</strong> <span style="font-size:15px;font-weight:bold;color:#d97706;">${cleanPaymentRef}</span>
          </div>
          <div style="margin:20px 0;">
            <a href="${approveLink}" style="padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-right:12px;">✅ Approve & Activate</a>
            <a href="${rejectLink}" style="padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">❌ Reject</a>
          </div>
        </div>
      `,
      text: `Seller ${user.name} (${user.email}) re-submitted ₹1,000 payment with UTR: ${cleanPaymentRef}. Approve: ${approveLink}`,
    });

    res.json({
      success: true,
      message: 'Your ₹1,000 subscription payment reference has been re-submitted for admin verification. You will be notified once approved.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  directNITPSignIn,
  getUserProfile,
  forgotPassword,
  updateUserProfile,
  sendOtp,
  verifyOtp,
  forgotPasswordWithOtp,
  changePasswordWithOtp,
  verifyEmail,
  resendEmailOtp,
  sendPhoneOtp,
  verifyPhone,
  verifySubscriptionViaToken,
  getAdminSellers,
  verifySellerById,
  resubmitSellerPayment,
};
