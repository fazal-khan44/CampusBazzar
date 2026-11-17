import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Copy,
  Check,
  Store,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const AdminSubscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'active', 'rejected'
  const [copiedUtr, setCopiedUtr] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetSeller, setRejectTargetSeller] = useState(null);
  const [rejectReason, setRejectReason] = useState('Payment reference UTR could not be verified in bank statement');

  const isAdmin = user && user.email === 'campusbazzar4@gmail.com';

  const fetchSellers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/admin/sellers');
      setSellers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchSellers();
  }, [isAdmin]);

  const handleCopyUtr = (utr) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(''), 2000);
  };

  const handleApprove = async (sellerId, sellerName) => {
    if (!window.confirm(`Approve ₹1,000 monthly subscription for ${sellerName}? This will activate their seller account for 30 days.`)) {
      return;
    }

    setActionLoadingId(sellerId);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/auth/admin/verify-seller/${sellerId}`, {
        action: 'approve',
      });
      setSuccessMsg(data.message || `Activated subscription for ${sellerName}!`);
      fetchSellers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve seller subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectTargetSeller) return;

    setActionLoadingId(rejectTargetSeller._id);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/auth/admin/verify-seller/${rejectTargetSeller._id}`, {
        action: 'reject',
        reason: rejectReason.trim(),
      });
      setSuccessMsg(data.message || `Rejected payment for ${rejectTargetSeller.name}.`);
      setRejectModalOpen(false);
      setRejectTargetSeller(null);
      fetchSellers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-xl">
          <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Administrator Access Only
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            This verification panel is restricted to the platform superadmin (<strong>campusbazzar4@gmail.com</strong>).
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = sellers.filter((s) => s.subscriptionStatus === 'pending').length;
  const activeCount = sellers.filter((s) => s.subscriptionStatus === 'active').length;
  const rejectedCount = sellers.filter((s) => s.subscriptionStatus === 'rejected').length;

  const filteredSellers = sellers.filter((s) => {
    if (filter === 'pending') return s.subscriptionStatus === 'pending';
    if (filter === 'active') return s.subscriptionStatus === 'active';
    if (filter === 'rejected') return s.subscriptionStatus === 'rejected';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  Seller Subscriptions
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Logged in as <strong>campusbazzar4@gmail.com</strong> • ₹1,000 Monthly Subscriptions
              </p>
            </div>
          </div>

          <button
            onClick={fetchSellers}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold animate-fade-in flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-fade-in flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => setFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Sellers</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {sellers.length}
            </div>
          </div>

          <div
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Pending Review</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </div>
          </div>

          <div
            onClick={() => setFilter('active')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Active Subscribers</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {activeCount}
            </div>
          </div>

          <div
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filter === 'rejected'
                ? 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-400 ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">Rejected</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {rejectedCount}
            </div>
          </div>
        </div>

        {/* Sellers Table / Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {filter === 'all' && 'All Registered Sellers'}
              {filter === 'pending' && 'Sellers Awaiting ₹1,000 Payment Verification'}
              {filter === 'active' && 'Active Verified Sellers (30 Days Access)'}
              {filter === 'rejected' && 'Rejected Payment Submissions'}
              <span className="text-xs font-normal text-slate-400 ml-2">
                ({filteredSellers.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Loading seller records...</span>
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No sellers found in this category.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredSellers.map((seller) => {
                const isPending = seller.subscriptionStatus === 'pending' || seller.subscriptionStatus === 'none';
                const isActive = seller.subscriptionStatus === 'active';
                const isRejected = seller.subscriptionStatus === 'rejected';

                return (
                  <div
                    key={seller._id}
                    className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Left: Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {seller.name}
                        </span>
                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 animate-spin mr-1" />
                            <span>Verification Pending</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            <span>Active Subscriber</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      {/* Contact & Campus */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{seller.email}</span>
                        </span>
                        <a
                          href={`tel:+91${seller.phoneNumber}`}
                          className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>+91 {seller.phoneNumber}</span>
                        </a>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {seller.campus} • {seller.hostel}
                          </span>
                        </span>
                      </div>

                      {/* Payment UTR Display */}
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Payment UTR:
                        </span>
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <span>{seller.subscriptionPaymentRef || 'No UTR Provided'}</span>
                          {seller.subscriptionPaymentRef && (
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(seller.subscriptionPaymentRef)}
                              className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              title="Copy UTR"
                            >
                              {copiedUtr === seller.subscriptionPaymentRef ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹1,000 / month
                        </span>
                      </div>

                      {/* Rejection reason if any */}
                      {isRejected && seller.subscriptionRejectionReason && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 italic">
                          Reason: {seller.subscriptionRejectionReason}
                        </p>
                      )}

                      {/* Expiry date if active */}
                      {isActive && seller.subscriptionExpiresAt && (
                        <p className="text-xs text-slate-400">
                          Subscription active until:{' '}
                          <strong>
                            {new Date(seller.subscriptionExpiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2.5 pt-2 lg:pt-0 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleApprove(seller._id, seller.name)}
                          disabled={actionLoadingId === seller._id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Activate (30 Days)</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTargetSeller(seller);
                            setRejectModalOpen(true);
                          }}
                          disabled={actionLoadingId === seller._id}
                          className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Payment</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalOpen && rejectTargetSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Subscription for {rejectTargetSeller.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please state why the payment could not be verified. An email will be dispatched to{' '}
              <strong>{rejectTargetSeller.email}</strong>.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  placeholder="e.g. UTR number not found in bank statement for ₹1,000..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectTargetSeller._id}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
