import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { normalizeCategory } from '../utils/categories';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Phone,
  MessageSquare,
  ArrowLeft,
  Building,
  Hash,
  Trash2,
  CheckCircle,
  Tag,
  Loader2,
  Edit,
  GraduationCap,
  Lock,
  LogIn,
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleConnectChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isOwner) {
      alert('You are the seller of this item');
      return;
    }

    setChatLoading(true);
    try {
      const { data } = await api.post('/chat/conversation', {
        sellerId: product.seller._id,
        productId: product._id,
      });

      navigate('/chat', { state: { activeConversation: data } });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!window.confirm('Mark this item as sold?')) return;
    setActionLoading(true);
    try {
      const { data } = await api.put(`/products/${id}`, { status: 'Sold' });
      setProduct(data);
    } catch (err) {
      alert('Could not update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      navigate('/');
    } catch (err) {
      alert('Could not delete listing');
    }
  };

  const handleEdit = () => {
    navigate('/create-listing', { state: { editProduct: product } });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-2">Item not found</h2>
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-semibold">
          &larr; Back to marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user && product.seller && user._id === product.seller._id;
  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'];

  const campus = product.campus || product.seller?.campus || 'Patna Campus';
  const hostel = product.hostel || product.hostelName || product.seller?.hostel || 'Hostel';
  const phone = product.contactNumber || product.seller?.phoneNumber;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button navigation */}
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Image Showcase */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <img
              src={images[selectedImg]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.status !== 'Available' && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                <span className="px-6 py-2 rounded-2xl bg-rose-600 text-white font-extrabold text-xl uppercase tracking-widest shadow-xl">
                  {product.status}
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing Details & Location */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 inline-flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>{normalizeCategory(product.category)}</span>
              </span>
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Listed {new Date(product.createdAt).toLocaleDateString()}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {product.title}
            </h1>

            <div className="mt-3 flex items-baseline space-x-3">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                ₹{product.price}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Condition: {product.condition}
              </span>
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-slate-200/80 dark:border-slate-800/80 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Item Description
              </h3>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                {product.description}
              </p>
            </div>

            {/* Campus & Hostel Location Card */}
            <div className="mt-6 p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Campus & Hostel Location</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Campus
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    📍 {campus}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Hostel
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                    🏠 {hostel}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Contact Card / Protected for Non-Logged-In Users */}
            {!user ? (
              <div
                onClick={() => navigate('/login')}
                className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 shadow-xs hover:border-indigo-500/80 dark:hover:border-indigo-500/80 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group active:scale-[0.99]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/login');
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-md shadow-indigo-600/30">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm sm:text-base">
                        Seller Details & Contact
                      </h4>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Login Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Seller identity, contact number, and chat are protected. Sign in to view and connect.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 group-hover:underline">
                    <LogIn className="w-4 h-4" />
                    <span>Click here to Login & View Seller Details &rarr;</span>
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    NIT Patna Campus
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={
                        product.seller?.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={product.seller?.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        product.seller?._id && isUserOnline(product.seller._id)
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                      title={
                        product.seller?._id && isUserOnline(product.seller._id)
                          ? 'Seller is Online'
                          : 'Seller is Offline'
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {product.seller?.name || 'Fellow Hosteller'}
                      </h4>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" title="Verified Campus Resident" />
                      {product.seller?.isEmailVerified && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30" title="Verified Student">
                          <GraduationCap className="w-3 h-3" />
                          <span>Verified Student</span>
                        </span>
                      )}
                      {product.seller?.isPhoneVerified && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" title="Phone Verified">
                          <Phone className="w-3 h-3" />
                          <span>Phone Verified</span>
                        </span>
                      )}
                      {product.seller?._id && isUserOnline(product.seller._id) ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active Now</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>Offline</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {product.seller?.hostel || hostel} • {product.seller?.campus || campus}
                    </p>
                  </div>
                </div>

                {/* Direct Contact Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call ({phone})</span>
                    </a>
                  )}

                  {!isOwner && (
                    <button
                      onClick={handleConnectChat}
                      disabled={chatLoading}
                      className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-98"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      <span>Connect on Chat</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Owner Management Controls */}
          {isOwner && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                You own this listing
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {product.status === 'Available' && (
                  <button
                    onClick={handleMarkAsSold}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark as Sold</span>
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
