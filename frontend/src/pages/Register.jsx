import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ALL_CAMPUSES,
  getHostelsForCampus,
  CAMPUS_NAMES,
} from '../utils/nitpLocations';
import {
  GraduationCap,
  Loader2,
  User,
  Lock,
  Building,
  Hash,
  Phone,
  ShieldAlert,
  MapPin,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    emailPrefix: '',
    password: '',
    campus: CAMPUS_NAMES.PATNA,
    hostel: 'Brahmaputra Hostel',
    roomNumber: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleCampusChange = (e) => {
    const newCampus = e.target.value;
    const availableHostels = getHostelsForCampus(newCampus);
    // Reset and auto-select first hostel of the new campus
    setFormData({
      ...formData,
      campus: newCampus,
      hostel: availableHostels.length > 0 ? availableHostels[0].name : '',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPrefix = formData.emailPrefix.trim().toLowerCase();
    const fullEmail = cleanPrefix.includes('@')
      ? cleanPrefix
      : `${cleanPrefix}@nitp.ac.in`;

    if (!fullEmail.endsWith('@nitp.ac.in')) {
      setError('Registration is strictly restricted to NIT Patna college emails (@nitp.ac.in)');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.campus || !formData.hostel) {
      setError('Please select both Campus and Hostel');
      return;
    }

    const payload = {
      name: formData.name,
      email: fullEmail,
      password: formData.password,
      campus: formData.campus,
      hostel: formData.hostel,
      roomNumber: formData.roomNumber,
      phoneNumber: formData.phoneNumber,
    };

    const result = await register(payload);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const currentHostels = getHostelsForCampus(formData.campus);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/25 mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            NIT Patna Hosteller Registration
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            Register with College ID
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose your campus and hostel to access internal buying & selling
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Official NITP Email ID *
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50">
              <input
                type="text"
                name="emailPrefix"
                value={formData.emailPrefix}
                onChange={handleChange}
                placeholder="aarav.sharma or aarav"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                required
              />
              <span className="inline-flex items-center px-3 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 select-none">
                @nitp.ac.in
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                required
              />
            </div>
          </div>

          {/* Campus and Dynamic Hostel Selection */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Campus Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Campus *</span>
                </label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleCampusChange}
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

              {/* Dynamic Hostel Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Hostel *</span>
                </label>
                <select
                  name="hostel"
                  value={formData.hostel}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                >
                  {currentHostels.map((h) => (
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
                  Room No. *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 214"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  WhatsApp / Phone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
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
            className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating NITP Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Sign In with NITP ID
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
