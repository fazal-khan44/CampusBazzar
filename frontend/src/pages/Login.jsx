import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ALL_CAMPUSES,
  getHostelsForCampus,
  CAMPUS_NAMES,
} from '../utils/nitpLocations';
import {
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building,
  Phone,
  MapPin,
  Hash,
  Store,
  UserCheck,
  User,
  Camera,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Sparkles,
  Zap,
} from 'lucide-react';
import PaymentGatewayModal from '../components/payment/PaymentGatewayModal';

const Login = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'signin';

  // Tabs: 'signin', 'nitp-student', 'seller-signup', 'forgot-password'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (
      tabParam &&
      ['signin', 'nitp-student', 'seller-signup', 'forgot-password'].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password (OTP Verification) State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpStep, setForgotOtpStep] = useState(1); // 1: enter email/phone & send OTP, 2: enter OTP & reset password
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [forgotOtpLoading, setForgotOtpLoading] = useState(false);

  // NITP Student Registration State
  const [collegeUsername, setCollegeUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [directName, setDirectName] = useState('');
  const [directCampus, setDirectCampus] = useState(CAMPUS_NAMES.PATNA);
  const [directHostel, setDirectHostel] = useState('Brahmaputra Hostel');
  const [directRoom, setDirectRoom] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directAvatar, setDirectAvatar] = useState('');
  const [directAvatarPreview, setDirectAvatarPreview] = useState('');
  const directAvatarRef = useRef(null);

  // Campus Seller / Any Email Signup State
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerCampus, setSellerCampus] = useState(CAMPUS_NAMES.PATNA);
  const [sellerHostelOrArea, setSellerHostelOrArea] = useState('Campus Seller / Day Scholar');
  const [sellerAvatar, setSellerAvatar] = useState('');
  const [sellerAvatarPreview, setSellerAvatarPreview] = useState('');
  const sellerAvatarRef = useRef(null);

  // Seller Subscription & Payment Gateway State (₹1,000 / month)
  const [sellerPaymentRef, setSellerPaymentRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [sellerSignupSuccessData, setSellerSignupSuccessData] = useState(null);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [paymentGatewayContext, setPaymentGatewayContext] = useState('register'); // 'register' or 'resubmit'
  const [registeringWithPayment, setRegisteringWithPayment] = useState(false);

  // Sign In Subscription Verification States
  const [loginPendingSeller, setLoginPendingSeller] = useState(null);
  const [loginRejectedSeller, setLoginRejectedSeller] = useState(null);
  const [resubmitUtr, setResubmitUtr] = useState('');
  const [resubmitLoading, setResubmitLoading] = useState(false);

  // Shared helper: convert image file → base64
  const handleAvatarChange = (file, setAvatar, setPreview) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const {
    login,
    register,
    sendOtp,
    resetPasswordWithOtp,
    resubmitSellerPayment,
    loading,
    directCollegeLogin,
  } = useAuth();
  const navigate = useNavigate();

  // Mode 1: Universal Sign In (For BOTH NITP Students & Campus Sellers)
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoginPendingSeller(null);
    setLoginRejectedSeller(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    const result = await login(cleanEmail, password);
    if (result.success) {
      navigate('/');
    } else if (result.isEmailVerified === false) {
      navigate('/verify-email', {
        state: {
          email: result.email || cleanEmail,
          message: 'Your email is not verified yet. Enter the 6-digit code sent to your inbox.',
        },
      });
    } else if (result.subscriptionStatus === 'pending') {
      setLoginPendingSeller({
        email: result.email || cleanEmail,
        paymentRef: result.paymentRef || 'Submitted at registration',
        message: result.message,
      });
    } else if (result.subscriptionStatus === 'rejected') {
      setLoginRejectedSeller({
        email: result.email || cleanEmail,
        paymentRef: result.paymentRef || '',
        message: result.message,
      });
    } else {
      setError(result.message || 'Invalid email or password');
    }
  };

  // Re-submit Payment for Rejected Sellers
  const handleResubmitPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resubmitUtr.trim()) {
      setError('Please enter your new 12-digit UPI / Bank Transaction ID (UTR).');
      return;
    }

    const targetEmail = loginRejectedSeller?.email || email.trim().toLowerCase();
    if (!targetEmail || !password) {
      setError('Please enter your email and password to re-submit payment reference.');
      return;
    }

    setResubmitLoading(true);
    try {
      const res = await resubmitSellerPayment(targetEmail, password, resubmitUtr.trim());
      if (res.success) {
        setLoginRejectedSeller(null);
        setLoginPendingSeller({
          email: targetEmail,
          paymentRef: resubmitUtr.trim(),
          message:
            'Payment reference updated! Admin campusbazzar4@gmail.com has been notified for re-verification.',
        });
        setResubmitUtr('');
        setSuccessMsg(
          'Your ₹1,000 subscription payment has been re-submitted successfully. Once verified by campusbazzar4@gmail.com, you can log in.'
        );
      } else {
        setError(res.message || 'Failed to update payment reference');
      }
    } catch (err) {
      setError('Error communicating with server');
    } finally {
      setResubmitLoading(false);
    }
  };

  // Mode 2: Create Account for NITP Student using College Email ID (@nitp.ac.in)
  const handleStudentCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmed = collegeUsername.trim().toLowerCase();
    const fullEmail = trimmed.includes('@') ? trimmed : `${trimmed}@nitp.ac.in`;

    if (!trimmed) {
      setError('Please provide your NITP username or email');
      return;
    }

    if (!fullEmail.endsWith('@nitp.ac.in')) {
      setError('Only official NIT Patna emails (@nitp.ac.in) are permitted for student registration');
      return;
    }

    if (!directName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!studentPassword || studentPassword.length < 6) {
      setError('Password must be at least 6 characters so you can sign in anytime');
      return;
    }

    if (!directPhone.trim()) {
      setError('Please provide your Mobile / WhatsApp contact number');
      return;
    }

    const payload = {
      name: directName.trim(),
      email: fullEmail,
      password: studentPassword,
      campus: directCampus,
      hostel: directHostel,
      hostelName: directHostel,
      roomNumber: directRoom.trim() || '101',
      phoneNumber: directPhone.trim(),
      userType: 'student',
      ...(directAvatar ? { avatar: directAvatar } : {}),
    };

    const result = await register(payload);
    if (result.success) {
      navigate('/verify-email', {
        state: {
          email: fullEmail,
          message: 'Account created! Check your NITP email inbox for a 6-digit verification code.',
        },
      });
    } else {
      if (result.message && result.message.toLowerCase().includes('already exists')) {
        setError('An account with this NITP email already exists. Please switch to the "Sign In" tab to log in.');
      } else {
        setError(result.message || 'Student registration failed');
      }
    }
  };

  // Mode 3: Validate and Trigger Payment Gateway for Seller Registration
  const handleSellerSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!sellerName.trim() || !sellerEmail.trim() || !sellerPassword || !sellerPhone.trim()) {
      setError('Please fill in your name, email, password, and mobile number');
      return;
    }

    if (sellerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Open Payment Gateway modal to complete ₹1,000 monthly subscription payment
    setPaymentGatewayContext('register');
    setIsPaymentGatewayOpen(true);
  };

  // Called when payment is successfully verified by the Payment Gateway
  const handlePaymentSuccess = async (paymentResult) => {
    setIsPaymentGatewayOpen(false);

    if (paymentGatewayContext === 'resubmit') {
      setResubmitLoading(true);
      setError('');
      try {
        const targetEmail = loginRejectedSeller?.email || email.trim().toLowerCase();
        const res = await resubmitSellerPayment(
          targetEmail,
          password,
          paymentResult.paymentId,
          paymentResult.paymentVerificationToken,
          paymentResult.paymentMethod
        );
        if (res.success) {
          setLoginRejectedSeller(null);
          setSuccessMsg(res.message || 'Payment verified! Your seller account is active for 30 days. You can sign in now.');
        } else {
          setError(res.message || 'Failed to update subscription payment');
        }
      } catch (err) {
        setError('Error updating subscription payment');
      } finally {
        setResubmitLoading(false);
      }
      return;
    }

    setRegisteringWithPayment(true);
    setError('');

    const payload = {
      name: sellerName.trim(),
      email: sellerEmail.trim().toLowerCase(),
      password: sellerPassword,
      phoneNumber: sellerPhone.trim(),
      campus: sellerCampus,
      hostel: sellerHostelOrArea || 'Campus Seller / Day Scholar',
      hostelName: sellerHostelOrArea || 'Campus Seller / Day Scholar',
      roomNumber: 'N/A',
      userType: 'seller',
      paymentId: paymentResult.paymentId,
      orderId: paymentResult.orderId,
      paymentVerificationToken: paymentResult.paymentVerificationToken,
      paymentMethod: paymentResult.paymentMethod,
      subscriptionPaymentRef: paymentResult.paymentId,
      ...(sellerAvatar ? { avatar: sellerAvatar } : {}),
    };

    const result = await register(payload);
    setRegisteringWithPayment(false);

    if (result.success) {
      setSellerSignupSuccessData({
        name: sellerName.trim(),
        email: sellerEmail.trim().toLowerCase(),
        paymentRef: paymentResult.paymentId,
        orderId: paymentResult.orderId,
        paymentMethod: paymentResult.paymentMethod,
        message: result.message,
        isDirectActive: true,
      });
      // Clear sensitive form inputs
      setSellerPassword('');
      setEmail(sellerEmail.trim().toLowerCase());
    } else {
      setError(result.message || 'Registration failed after payment verification.');
    }
  };

  // Mode 4: Step 1 - Send Recovery OTP to Email or Mobile
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setForgotDevOtp('');

    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email address or mobile number');
      return;
    }

    setForgotOtpLoading(true);
    try {
      const res = await sendOtp(forgotIdentifier.trim(), 'forgot_password');
      if (res.success) {
        setForgotOtpStep(2);
        setSuccessMsg(res.message);
        if (res.devOtp) {
          setForgotDevOtp(res.devOtp);
        }
      } else {
        setError(res.message || 'Could not send OTP');
      }
    } catch (err) {
      setError('Network error sending OTP');
    } finally {
      setForgotOtpLoading(false);
    }
  };

  // Mode 4: Step 2 - Verify OTP & Reset Password
  const handleVerifyForgotOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotOtp.trim()) {
      setError('Please enter the 6-digit OTP received');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setForgotOtpLoading(true);
    try {
      const result = await resetPasswordWithOtp(
        forgotIdentifier.trim(),
        forgotOtp.trim(),
        forgotNewPassword
      );

      if (result.success) {
        setSuccessMsg(result.message || 'Password reset successfully! Please sign in with your new password.');
        if (forgotIdentifier.includes('@')) {
          setEmail(forgotIdentifier.trim().toLowerCase());
        }
        setPassword('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotOtpStep(1);
        setForgotDevOtp('');
        setActiveTab('signin');
      } else {
        setError(result.message || 'Password reset failed');
      }
    } catch (err) {
      setError('Error resetting password with OTP');
    } finally {
      setForgotOtpLoading(false);
    }
  };

  const directHostels = getHostelsForCampus(directCampus);
  const sellerHostels = getHostelsForCampus(sellerCampus);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="CampusBazzar"
            className="w-16 h-16 object-contain mx-auto mb-3"
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {activeTab === 'signin' && 'NIT Patna Campus Bazzar'}
            {activeTab === 'nitp-student' && 'NIT Patna Student Registration'}
            {activeTab === 'seller-signup' && 'Campus Seller Registration'}
            {activeTab === 'forgot-password' && 'Account Security & Recovery'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            {activeTab === 'signin' && 'Sign In to Buy & Sell'}
            {activeTab === 'nitp-student' && 'Create NITP Student Account'}
            {activeTab === 'seller-signup' && 'Create Seller Account'}
            {activeTab === 'forgot-password' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'signin' && 'Universal sign in for both NIT Patna students and campus sellers'}
            {activeTab === 'nitp-student' && 'First create your account using your official @nitp.ac.in email ID to access internal student trading'}
            {activeTab === 'seller-signup' && 'Create a seller account using any email address (Gmail, Yahoo, Outlook) to trade inside campus'}
            {activeTab === 'forgot-password' && 'Verify your registered email and mobile number to set a new password'}
          </p>
        </div>

        {/* 3-Way Mode Switcher (Hidden when on forgot-password screen) */}
        {activeTab !== 'forgot-password' ? (
          <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 rounded-xl transition-all text-center flex items-center justify-center space-x-1 ${
                activeTab === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('nitp-student');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 rounded-xl transition-all text-center flex items-center justify-center space-x-1 ${
                activeTab === 'nitp-student'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">NITP Student</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('seller-signup');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 rounded-xl transition-all text-center flex items-center justify-center space-x-1 ${
                activeTab === 'seller-signup'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">New Seller</span>
            </button>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between p-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/50">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center space-x-1.5 pl-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Password Recovery</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setError('');
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        {/* Tab 1: Universal Sign In (Both Student & New Seller) */}
        {activeTab === 'signin' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            {/* Seller Subscription Pending Alert */}
            {loginPendingSeller && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Seller Subscription Pending Verification</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                  Your seller account is registered, but requires verification of the <strong>₹1,000 monthly subscription fee</strong> by administrator <strong className="underline">campusbazzar4@gmail.com</strong>.
                </p>
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-amber-200 dark:border-amber-900/60 font-mono text-[11px]">
                  <span className="text-slate-500">Submitted UTR: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{loginPendingSeller.paymentRef}</span>
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Once verified, you will be able to log in immediately. Need urgent verification? Email <a href="mailto:campusbazzar4@gmail.com" className="font-bold underline">campusbazzar4@gmail.com</a>.
                </p>
              </div>
            )}

            {/* Seller Subscription Rejected Alert & Re-submission */}
            {loginRejectedSeller && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Subscription Payment Rejected</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                  {loginRejectedSeller.message || 'Your previous ₹1,000 subscription payment reference could not be verified by admin campusbazzar4@gmail.com.'}
                </p>
                
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Admin UPI:</span>
                    <code className="font-mono font-bold text-slate-800 dark:text-slate-200">campusbazzar4@gmail.com</code>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Enter New Valid UTR / Transaction ID (₹1,000)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resubmitUtr}
                        onChange={(e) => setResubmitUtr(e.target.value)}
                        placeholder="New 12-digit UTR"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleResubmitPayment}
                        disabled={resubmitLoading || !resubmitUtr.trim()}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50 flex items-center space-x-1"
                      >
                        {resubmitLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Re-submit</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (!password) {
                            setError('Please enter your password above first, then click Pay with Razorpay.');
                            return;
                          }
                          setPaymentGatewayContext('resubmit');
                          setIsPaymentGatewayOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Instant Fix: Pay ₹1,000 via Razorpay Gateway</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/50 text-[11px] text-indigo-900 dark:text-indigo-300">
              <span className="font-bold">Welcome back!</span> Both NIT Patna students (@nitp.ac.in) and registered sellers can sign in below.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nitp.ac.in or seller@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(email ? email.trim() : '');
                    setActiveTab('forgot-password');
                    setForgotOtpStep(1);
                    setForgotOtp('');
                    setForgotNewPassword('');
                    setForgotConfirmPassword('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Account</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-center text-xs">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Don't have an account yet?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('nitp-student');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Create NITP Student Account &rarr;</span>
                </button>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('seller-signup');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Register as New Seller &rarr;</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Create NITP Student Account using @nitp.ac.in email ID */}
        {activeTab === 'nitp-student' && (
          <form onSubmit={handleStudentCreateAccount} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
              <p className="font-bold flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Create Your NITP Student Account</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Enter your official NIT Patna email ID (@nitp.ac.in) and set a password. Once created, you can easily sign in anytime using the Sign In tab.
              </p>
            </div>

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-300 dark:border-indigo-700 cursor-pointer group"
                onClick={() => directAvatarRef.current?.click()}
              >
                {directAvatarPreview ? (
                  <img src={directAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => directAvatarRef.current?.click()}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                {directAvatarPreview ? 'Change Photo' : 'Add Profile Photo (optional)'}
              </button>
              <input
                ref={directAvatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0], setDirectAvatar, setDirectAvatarPreview)}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Your Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  required
                />
              </div>
            </div>

            {/* NITP College Email ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                NITP College Email ID *
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50">
                <input
                  type="text"
                  value={collegeUsername}
                  onChange={(e) => setCollegeUsername(e.target.value)}
                  placeholder="e.g. rohan or rohan.sharma"
                  className="flex-1 px-3.5 py-3 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                  required
                />
                <span className="inline-flex items-center px-3.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 select-none">
                  @nitp.ac.in
                </span>
              </div>
            </div>

            {/* Create Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Create Password (for Signing In) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  required
                />
              </div>
            </div>

            {/* Campus & Dynamic Hostel Selection */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Hostel Details & Phone
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Campus *</span>
                  </label>
                  <select
                    value={directCampus}
                    onChange={(e) => {
                      const c = e.target.value;
                      const hList = getHostelsForCampus(c);
                      setDirectCampus(c);
                      setDirectHostel(hList.length > 0 ? hList[0].name : '');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  >
                    {ALL_CAMPUSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Hostel *</span>
                  </label>
                  <select
                    value={directHostel}
                    onChange={(e) => setDirectHostel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  >
                    {directHostels.map((h) => (
                      <option key={h.name} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Room No.
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={directRoom}
                      onChange={(e) => setDirectRoom(e.target.value)}
                      placeholder="e.g. 214"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Mobile / WhatsApp *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating NITP Student Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Student Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Already created your student account? Sign In here &rarr;
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Create Account for Campus Sellers (Any Email) */}
        {activeTab === 'seller-signup' &&
          (sellerSignupSuccessData ? (
            /* ---- POST-REGISTRATION SUCCESS SCREEN ---- */
            <div className="space-y-5 text-center py-4 animate-in fade-in duration-300">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-sm border ${
                sellerSignupSuccessData.isDirectActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/60'
              }`}>
                {sellerSignupSuccessData.isDirectActive
                  ? <CheckCircle2 className="w-9 h-9" />
                  : <Clock className="w-8 h-8 animate-pulse" />
                }
              </div>

              <div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                  sellerSignupSuccessData.isDirectActive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}>
                  {sellerSignupSuccessData.isDirectActive ? '✓ Payment Verified — Account Active!' : 'Payment Verification Pending'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  {sellerSignupSuccessData.isDirectActive
                    ? 'Welcome to CampusBazzar!'
                    : 'Registration & Subscription Submitted!'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {sellerSignupSuccessData.isDirectActive
                    ? <>Your ₹1,000 subscription was verified instantly. <strong className="text-slate-900 dark:text-white">{sellerSignupSuccessData.name}</strong>, your seller account is now <span className="text-emerald-600 font-bold">active for 30 days</span>.</>
                    : <>Thank you, <strong className="text-slate-900 dark:text-white">{sellerSignupSuccessData.name}</strong>. Your registration and ₹1,000 subscription are under admin review.</>
                  }
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Registered Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{sellerSignupSuccessData.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Subscription:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹1,000 / month</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Payment ID / UTR:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]">{sellerSignupSuccessData.paymentRef}</span>
                </div>
                {sellerSignupSuccessData.paymentMethod && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sellerSignupSuccessData.paymentMethod}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Account Status:</span>
                  {sellerSignupSuccessData.isDirectActive
                    ? <span className="font-bold text-emerald-600 dark:text-emerald-400">Active (30 Days)</span>
                    : <span className="font-bold text-amber-600 dark:text-amber-400">Awaiting Admin Verification</span>
                  }
                </div>
              </div>

              {sellerSignupSuccessData.isDirectActive ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 text-left leading-relaxed">
                  <p className="font-bold flex items-center space-x-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Your account is verified and ready!</span>
                  </p>
                  A payment receipt has been emailed to <strong>{sellerSignupSuccessData.email}</strong>. Sign in now to start listing products and selling on CampusBazzar.
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 text-left leading-relaxed">
                  <p className="font-bold flex items-center space-x-1.5 mb-1 text-indigo-700 dark:text-indigo-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>How verification works:</span>
                  </p>
                  Admin <strong>campusbazzar4@gmail.com</strong> has been notified. Once your payment is verified against bank records, your account will be activated and you will receive a confirmation email.
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSellerSignupSuccessData(null);
                    setActiveTab('signin');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{sellerSignupSuccessData.isDirectActive ? 'Sign In Now' : 'Go to Sign In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSellerSignupSuccessData(null)}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Register Another
                </button>
              </div>
            </div>
          ) : registeringWithPayment ? (
            /* ---- COMPLETING REGISTRATION SPINNER ---- */
            <div className="py-16 text-center space-y-5">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-900 animate-ping opacity-25"></div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Activating Seller Account</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Payment verified! Finalizing registration...</p>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Please wait while we set up your seller profile.</p>
            </div>
          ) : (
            /* ---- REGISTRATION FORM ---- */
            <form onSubmit={handleSellerSignup} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
                <p className="font-bold flex items-center space-x-1.5">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span>Open for Everyone Selling in Campus</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Use your Gmail, Yahoo, Outlook, or personal email. A ₹1,000 / month subscription is processed instantly via our secure payment gateway.
                </p>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-300 dark:border-indigo-700 cursor-pointer group"
                  onClick={() => sellerAvatarRef.current?.click()}
                >
                  {sellerAvatarPreview ? (
                    <img src={sellerAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => sellerAvatarRef.current?.click()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  {sellerAvatarPreview ? 'Change Profile Photo' : 'Add Profile Photo (optional)'}
                </button>
                <input
                  ref={sellerAvatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0], setSellerAvatar, setSellerAvatarPreview)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name / Store Name *
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="e.g. Rahul Kumar or Campus Stationery Corner"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Any Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={sellerEmail}
                      onChange={(e) => setSellerEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile / WhatsApp *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Campus Location */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Campus Location *</span>
                    </label>
                    <select
                      value={sellerCampus}
                      onChange={(e) => setSellerCampus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    >
                      {ALL_CAMPUSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Pickup / Base Spot</span>
                    </label>
                    <select
                      value={sellerHostelOrArea}
                      onChange={(e) => setSellerHostelOrArea(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="Campus Seller / Day Scholar">General Campus Seller / Day Scholar</option>
                      {sellerHostels.map((h) => (
                        <option key={h.name} value={h.name}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Gateway CTA */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm">
                      ₹
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Seller Monthly Subscription</p>
                      <p className="text-[11px] text-indigo-200">Processed instantly via secure gateway</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-extrabold text-sm border border-white/30">
                    ₹1,000
                  </span>
                </div>
                <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-2">
                  <div className="flex items-center space-x-2 text-[11px] text-indigo-900 dark:text-indigo-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Instant account activation after payment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-indigo-900 dark:text-indigo-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Supports UPI, Credit/Debit Card & NetBanking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-indigo-900 dark:text-indigo-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>256-bit SSL encrypted — 100% secure</span>
                  </div>
                </div>
              </div>

              {/* Pay & Register button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm shadow-lg shadow-indigo-600/40 transition-all flex items-center justify-center space-x-2.5 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Form...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Proceed to Payment Gateway (₹1,000)</span>
                    <Sparkles className="w-3.5 h-3.5 opacity-70" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Already have an account? Sign In here &rarr;
                </button>
              </div>
            </form>
          ))}

        {/* Tab 4: Forgot / Reset Password Screen (via Email OTP) */}
        {activeTab === 'forgot-password' && (
          <div>
            <div className="p-3.5 mb-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
              <p className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Password Reset via Email OTP</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Enter your registered email address. We will send a 6-digit OTP verification code directly to your inbox to reset your password.
              </p>
            </div>

            {forgotOtpStep === 1 ? (
              /* Step 1: Request OTP */
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. apoorvs.ug24.ee@nitp.ac.in or seller@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the exact email used when creating your NIT Patna student or seller account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotOtpLoading || !forgotIdentifier.trim()}
                  className="w-full mt-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {forgotOtpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP to Email...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Password Reset OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP & Set New Password */
              <form onSubmit={handleVerifyForgotOtpSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs">
                  <p className="font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>OTP Dispatched</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    A 6-digit verification code has been sent to <strong>{forgotIdentifier}</strong>. Check your inbox and spam folder.
                  </p>
                </div>

                {forgotDevOtp && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Instant Verification Code</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      If your college server is delaying external emails, here is your 6-digit code:
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-amber-200 dark:border-amber-900/60">
                      <span className="font-mono text-xl font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                        {forgotDevOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForgotOtp(forgotDevOtp)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>
                )}

                {/* 6 Digit OTP input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full tracking-widest text-center text-xl font-mono font-bold px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={forgotOtpLoading || forgotOtp.length !== 6 || !forgotNewPassword}
                    className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    {forgotOtpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Resetting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify OTP & Set Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotOtpStep(1);
                      setForgotOtp('');
                      setForgotDevOtp('');
                    }}
                    className="px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Remember your password? Sign In here</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentGatewayOpen}
        onClose={() => setIsPaymentGatewayOpen(false)}
        amount={1000}
        sellerData={{
          name: paymentGatewayContext === 'resubmit' ? 'Seller Account' : sellerName,
          email: paymentGatewayContext === 'resubmit' ? (loginRejectedSeller?.email || email) : sellerEmail,
          phoneNumber: paymentGatewayContext === 'resubmit' ? '' : sellerPhone,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Login;
