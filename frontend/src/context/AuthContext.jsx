import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('userInfo') || 'null');
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        isEmailVerified: error.response?.data?.isEmailVerified,
        subscriptionStatus: error.response?.data?.subscriptionStatus,
        paymentRef: error.response?.data?.paymentRef,
        email: error.response?.data?.email || error.response?.data?.sellerEmail || email,
        message: error.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const directCollegeLogin = async (email, details = {}) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/nitp-direct', { email, ...details });
      if (data.token) {
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      }
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        isEmailVerified: error.response?.data?.isEmailVerified,
        email: error.response?.data?.email || email,
        message: error.response?.data?.message || 'Direct sign in failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', userData);
      if (data.token) {
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      }
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify email with 6-digit OTP code
  const verifyEmail = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email, otp });
      if (data.token) {
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      }
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Email verification failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // Resend Email OTP
  const resendEmailOtp = async (email) => {
    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        cooldownRemaining: error.response?.data?.cooldownRemaining,
        message: error.response?.data?.message || 'Failed to resend OTP',
      };
    }
  };

  // Request Phone Verification OTP
  const sendPhoneOtp = async (phoneNumber) => {
    try {
      const { data } = await api.post('/auth/send-phone-otp', { phoneNumber });
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        cooldownRemaining: error.response?.data?.cooldownRemaining,
        message: error.response?.data?.message || 'Failed to send phone OTP',
      };
    }
  };

  // Verify Phone with 6-digit OTP
  const verifyPhone = async (otp) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-phone', { otp });
      if (user) {
        const updated = { ...user, isPhoneVerified: true };
        setUser(updated);
        localStorage.setItem('userInfo', JSON.stringify(updated));
      }
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Phone verification failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', profileData);
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (identifier, purpose = 'forgot_password') => {
    try {
      const { data } = await api.post('/auth/send-otp', { identifier, purpose });
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  };

  const verifyOtp = async (identifier, otp, purpose = 'forgot_password') => {
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, otp, purpose });
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid OTP',
      };
    }
  };

  const resetPasswordWithOtp = async (identifier, otp, newPassword) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password-otp', {
        identifier,
        otp,
        newPassword,
      });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const changePasswordWithOtp = async (otp, newPassword) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/change-password-otp', {
        otp,
        newPassword,
      });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password',
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, phoneNumber, newPassword) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email,
        phoneNumber,
        newPassword,
      });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const resubmitSellerPayment = async (
    email,
    password,
    subscriptionPaymentRef,
    paymentVerificationToken = null,
    paymentMethod = null
  ) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/seller/resubmit-payment', {
        email,
        password,
        subscriptionPaymentRef,
        paymentVerificationToken,
        paymentMethod,
      });
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Payment re-submission failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        directCollegeLogin,
        register,
        verifyEmail,
        resendEmailOtp,
        sendPhoneOtp,
        verifyPhone,
        updateProfile,
        sendOtp,
        verifyOtp,
        resetPasswordWithOtp,
        changePasswordWithOtp,
        resetPassword,
        resubmitSellerPayment,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
