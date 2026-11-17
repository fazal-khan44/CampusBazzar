import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  ALL_CAMPUSES,
  getHostelsForCampus,
} from '../utils/nitpLocations';
import {
  User,
  ShieldCheck,
  Camera,
  FolderOpen,
  Upload,
  Lock,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Building,
  Hash,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  ExternalLink,
  Tag,
  Check,
  RefreshCw,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
];

const Profile = () => {
  const { user, updateProfile, sendOtp, changePasswordWithOtp } = useAuth();
  const { isUserOnline } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'listings'

  // Profile Form State
  const fileInputRef = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [campus, setCampus] = useState(user?.campus || 'Patna Campus');
  const [hostel, setHostel] = useState(user?.hostel || user?.hostelName || 'Brahmaputra Hostel');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Handle local file upload from device folder
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setProfileErrorMsg('Image size should be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatar(reader.result);
        setProfileErrorMsg('');
        setProfileSuccessMsg('Profile photo selected from folder! Click "Save Profile Changes" to save.');
        setTimeout(() => setProfileSuccessMsg(''), 5000);
      }
    };
    reader.onerror = () => {
      setProfileErrorMsg('Failed to read chosen file');
    };
    reader.readAsDataURL(file);
  };

  // Password / Security OTP State
  const [otpStep, setOtpStep] = useState(1); // 1: request, 2: verify & change
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');
  const [otpDevHint, setOtpDevHint] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Listings State
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingFilter, setListingFilter] = useState('all'); // 'all' | 'available' | 'sold'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || AVATAR_PRESETS[0]);
      setCampus(user.campus || 'Patna Campus');
      setHostel(user.hostel || user.hostelName || 'Brahmaputra Hostel');
      setRoomNumber(user.roomNumber || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  // Fetch user's listings
  const fetchListings = async () => {
    try {
      setListingsLoading(true);
      const { data } = await api.get('/products/my-listings');
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setListingsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  // Handle Profile Save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await updateProfile({
        name,
        avatar,
        campus,
        hostel,
        hostelName: hostel,
        roomNumber,
        phoneNumber,
      });

      if (res.success) {
        setProfileSuccessMsg('Profile updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setProfileErrorMsg(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setProfileErrorMsg('An error occurred while saving profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Send OTP for Password Change
  const handleRequestPasswordOtp = async () => {
    setOtpSending(true);
    setOtpSentMsg('');
    setOtpErrorMsg('');
    setOtpDevHint('');

    try {
      const res = await sendOtp(user.email, 'change_password');
      if (res.success) {
        setOtpStep(2);
        setOtpSentMsg(res.message);
        if (res.devOtp) {
          setOtpDevHint(res.devOtp);
        }
      } else {
        setOtpErrorMsg(res.message || 'Could not dispatch OTP');
      }
    } catch (err) {
      setOtpErrorMsg('Network error while requesting OTP');
    } finally {
      setOtpSending(false);
    }
  };

  // Handle Verify OTP & Change Password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setOtpErrorMsg('');
    setPasswordChangeSuccess('');

    if (newPassword.length < 6) {
      setOtpErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOtpErrorMsg('Passwords do not match');
      return;
    }

    setOtpSending(true);
    try {
      const res = await changePasswordWithOtp(otp, newPassword);
      if (res.success) {
        setPasswordChangeSuccess(res.message || 'Password changed successfully!');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpStep(1);
        setOtpDevHint('');
      } else {
        setOtpErrorMsg(res.message || 'Failed to change password');
      }
    } catch (err) {
      setOtpErrorMsg('Error verifying OTP and updating password');
    } finally {
      setOtpSending(false);
    }
  };

  // Toggle Product Sold status
  const handleToggleSold = async (product) => {
    const newStatus = product.status === 'Sold' ? 'Available' : 'Sold';
    setActionLoadingId(product._id);
    try {
      await api.put(`/products/${product._id}`, { status: newStatus });
      setListings((prev) =>
        prev.map((item) => (item._id === product._id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update item status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete product listing
  const handleDeleteListing = async (productId) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    setActionLoadingId(productId);
    try {
      await api.delete(`/products/${productId}`);
      setListings((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Please Sign In</h2>
        <p className="text-sm text-slate-500 mb-6">You must be logged in to access your profile.</p>
        <Link
          to="/login"
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Calculate listing stats
  const totalListed = listings.length;
  const soldItems = listings.filter((item) => item.status === 'Sold');
  const activeItems = listings.filter((item) => item.status !== 'Sold');
  const totalRevenue = soldItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const filteredListings = listings.filter((item) => {
    if (listingFilter === 'sold') return item.status === 'Sold';
    if (listingFilter === 'available') return item.status !== 'Sold';
    return true;
  });

  const availableHostels = getHostelsForCampus(campus);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          {/* Avatar with Active Online Badge & Quick Camera Upload */}
          <div className="relative group">
            <img
              src={avatar}
              alt={user.name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-orange-500/20 shadow-md shadow-orange-500/10"
            />
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-3 border-white dark:border-slate-900 ${
                isUserOnline(user._id) ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              title={isUserOnline(user._id) ? 'Active Online' : 'Offline'}
            />
            {/* Quick Upload Button on Avatar Hover */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs"
              title="Click to change profile picture from folder"
            >
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">Change</span>
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {user.name}
              </h1>
              {user.email?.includes('nitp.ac.in') ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>NIT Patna Student</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  <span>Campus Seller</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{user.phoneNumber || 'No phone set'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Building className="w-3.5 h-3.5" />
                <span>{user.campus} • {user.hostel || user.hostelName} (Rm {user.roomNumber || 'N/A'})</span>
              </span>
            </div>

            {/* Quick Listing Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-[11px] text-slate-400 font-medium">Total Listed</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{totalListed}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active for Sale</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{activeItems.length}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/50 text-center">
                <span className="block text-[11px] text-purple-600 dark:text-purple-400 font-medium">Items Sold</span>
                <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">{soldItems.length}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/50 text-center">
                <span className="block text-[11px] text-orange-600 dark:text-orange-400 font-medium">Revenue Sold</span>
                <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">₹{totalRevenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Picture</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'security'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security (OTP)</span>
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'listings'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Listings & Sold Items ({totalListed})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EDIT PROFILE & PICTURE                            */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Edit Profile Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Update your display name, campus location, hostel details, and profile avatar
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Avatar Selector with Folder Upload & Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Profile Picture / Avatar
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs border border-orange-500/30 transition-all shadow-xs active:scale-95"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Upload from Folder</span>
                </button>
              </div>

              {/* Hidden file input for native folder browser */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />

              <div className="flex flex-wrap gap-3 items-center">
                {/* 1. Upload from Folder Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 border-dashed border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/15 text-orange-600 dark:text-orange-400 transition-all group shrink-0"
                  title="Choose image file from your device folder"
                >
                  <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold mt-0.5">Upload</span>
                </button>

                {/* 2. Preset Avatars */}
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatar(presetUrl)}
                    className={`relative rounded-2xl overflow-hidden p-0.5 border-2 transition-all shrink-0 ${
                      avatar === presetUrl
                        ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={presetUrl}
                      alt={`Avatar Preset ${idx + 1}`}
                      className="w-13 h-13 rounded-xl object-cover"
                    />
                    {avatar === presetUrl && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                ))}

                {/* 3. If avatar is a custom upload (not in presets), show custom preview with badge */}
                {avatar && !AVATAR_PRESETS.includes(avatar) && (
                  <div className="relative rounded-2xl overflow-hidden p-0.5 border-2 border-orange-500 ring-2 ring-orange-500/30 scale-105 shrink-0">
                    <img
                      src={avatar}
                      alt="Custom Uploaded Avatar"
                      className="w-13 h-13 rounded-xl object-cover"
                    />
                    <span
                      className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs"
                      title="Selected Custom Photo"
                    >
                      ✓
                    </span>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[8px] text-center font-bold py-0.5">
                      Custom
                    </span>
                  </div>
                )}
              </div>

              {/* Custom Image URL input */}
              <div className="mt-3 flex items-center space-x-2 max-w-md">
                <input
                  type="url"
                  placeholder="Or paste custom image URL..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl.trim()) {
                      setAvatar(customAvatarUrl.trim());
                      setCustomAvatarUrl('');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Name & Mobile Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Display Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile / WhatsApp Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Campus & Hostel Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Campus Location *
                </label>
                <select
                  value={campus}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCampus(c);
                    const hostels = getHostelsForCampus(c);
                    if (hostels.length > 0) setHostel(hostels[0].name);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {ALL_CAMPUSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hostel / Residence *
                </label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {availableHostels.map((h) => (
                    <option key={h.name} value={h.name}>{h.name}</option>
                  ))}
                  <option value="Campus Seller / Day Scholar">Campus Seller / Day Scholar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room Number
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 214 or N/A"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-500/30 transition-all flex items-center space-x-2"
              >
                {profileSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PASSWORD & SECURITY (OTP)                         */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-orange-500" />
              <span>Change Password via OTP Verification</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              For your account security, a 6-digit One-Time Password (OTP) is sent to your registered email or phone to verify your identity before updating your password.
            </p>
          </div>

          {passwordChangeSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordChangeSuccess}</span>
            </div>
          )}

          {otpErrorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpErrorMsg}</span>
            </div>
          )}

          {otpSentMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{otpSentMsg}</span>
              </div>
              {otpDevHint && (
                <span className="font-mono font-bold bg-amber-200/80 dark:bg-amber-900 px-2 py-0.5 rounded text-[11px]">
                  OTP: {otpDevHint}
                </span>
              )}
            </div>
          )}

          {otpStep === 1 ? (
            /* Step 1: Request OTP */
            <div className="max-w-md space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Verification Destination:
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Registered Email: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{user.email}</span>
                </p>
                {user.phoneNumber && (
                  <p className="text-slate-500 dark:text-slate-400">
                    Registered Mobile: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{user.phoneNumber}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleRequestPasswordOtp}
                disabled={otpSending}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-500/30 transition-all flex items-center justify-center space-x-2"
              >
                {otpSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Send Verification OTP</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Step 2: Enter OTP & Set New Password */
            <form onSubmit={handleChangePasswordSubmit} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter 6-Digit OTP *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full tracking-widest text-center text-lg font-mono font-bold px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={otpSending || otp.length !== 6 || !newPassword}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-500/30 transition-all flex items-center justify-center space-x-2"
                >
                  {otpSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Change Password</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(1);
                    setOtp('');
                    setOtpDevHint('');
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY LISTINGS & SOLD ITEMS                          */}
      {/* ======================================================== */}
      {activeTab === 'listings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Listed & Sold Campus Items
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your active products, mark items as Sold once purchase is complete, or delete listings
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setListingFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    listingFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({listings.length})
                </button>
                <button
                  onClick={() => setListingFilter('available')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    listingFilter === 'available'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Active ({activeItems.length})
                </button>
                <button
                  onClick={() => setListingFilter('sold')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    listingFilter === 'sold'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Sold ({soldItems.length})
                </button>
              </div>

              <Link
                to="/create-listing"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center space-x-1.5 shrink-0"
              >
                <span>+ Sell Item</span>
              </Link>
            </div>
          </div>

          {/* Listings List */}
          {listingsLoading ? (
            <div className="text-center py-16 text-xs text-slate-400">
              Loading your campus listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 max-w-sm mx-auto text-slate-400">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                No items found in this tab
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {listingFilter === 'sold'
                  ? 'None of your items have been marked as sold yet.'
                  : 'You have no active products. List a book, cycle, or kettle to start selling!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((item) => {
                const isSold = item.status === 'Sold';
                const isUpdating = actionLoadingId === item._id;

                return (
                  <div
                    key={item._id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSold
                        ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 shadow-xs hover:border-orange-500/30'
                    }`}
                  >
                    {/* Item Thumbnail & Info */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <img
                        src={
                          item.images?.[0] ||
                          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap mb-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          {isSold ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                              SOLD OUT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              AVAILABLE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-extrabold text-orange-600 dark:text-orange-400">
                            ₹{item.price}
                          </span>
                          <span>•</span>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>{item.condition}</span>
                          <span className="hidden md:inline">•</span>
                          <span className="hidden md:inline text-[11px] text-slate-400">
                            Listed {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Mark Sold, View, Delete */}
                    <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                      {/* Toggle Sold/Available Button */}
                      <button
                        onClick={() => handleToggleSold(item)}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                          isSold
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                        }`}
                        title={isSold ? 'Click to re-list as Available' : 'Click to mark as Sold'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSold ? 'Mark Available' : 'Mark as Sold'}</span>
                      </button>

                      {/* View Link */}
                      <Link
                        to={`/products/${item._id}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                        title="View Public Listing"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteListing(item._id)}
                        disabled={isUpdating}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
