import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';

const VerifyEmail = () => {
  const { verifyEmail, resendEmailOtp, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || location.state?.email || '';

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus first digit box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/[^0-9]/g, '');

    // Handle paste of multiple digits
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pasteDigits.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasteDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto focus next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setDigits(newDigits);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerifySubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    const res = await verifyEmail(email.trim(), otpCode);
    if (res.success) {
      setSuccessMsg('Email verified successfully! Welcome to CampusBazzar.');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } else {
      setError(res.message || 'Verification failed. Please check the code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await resendEmailOtp(email.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'A new verification code has been dispatched to your email.');
        setCooldown(60);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        if (res.cooldownRemaining) {
          setCooldown(res.cooldownRemaining);
        }
        setError(res.message || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Network error while resending verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
            <Mail className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
            Email Verification
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            We sent a 6-digit confirmation code to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {email || 'your email'}
            </span>
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerifySubmit} className="space-y-6">
          {/* 6 Individual Digit Input Boxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-center text-slate-600 dark:text-slate-400 mb-3">
              Enter 6-Digit OTP Code
            </label>
            <div className="flex justify-center space-x-2 sm:space-x-3" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border transition-all focus:outline-none ${
                    digit
                      ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* If user needs to change or retype email */}
          {!emailParam && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nitp.ac.in"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          )}

          {/* Submit Verification Button */}
          <button
            type="submit"
            disabled={loading || digits.some((d) => !d)}
            className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-500/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend OTP Section with 60s Countdown */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Didn't receive the email code? Check your spam/junk folder.
            </p>
            {cooldown > 0 ? (
              <span className="text-xs font-semibold text-slate-400 inline-flex items-center space-x-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 opacity-50" />
                <span>Resend code in {cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center space-x-1"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Resend 6-Digit Code</span>
                )}
              </button>
            )}
          </div>

          {/* Back to Sign In */}
          <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <Link
              to="/login"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center space-x-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
