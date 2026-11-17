import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  MapPin,
  Building,
  Hash,
  Phone,
  Sparkles,
  MessageSquare,
  Globe,
  Users,
  Send,
  PlusCircle,
  Package,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Store,
  GraduationCap,
  Eye,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { ALL_CAMPUSES, getHostelsForCampus } from '../../utils/nitpLocations';
import { PRESET_CATEGORIES } from '../../utils/categories';

const GuestFeatureShowcase = () => {
  // Active demo tab: 'sell' | 'listings' | 'global-chat' | 'p2p-chat' | 'profile' | 'all'
  const [activeTab, setActiveTab] = useState('sell');

  // SELL DEMO STATE
  const [sellTitle, setSellTitle] = useState('Milton 1L Stainless Steel Electric Kettle');
  const [sellCategory, setSellCategory] = useState('Hostel Appliances');
  const [sellCondition, setSellCondition] = useState('Gently Used (Good working condition)');
  const [sellPrice, setSellPrice] = useState('450');
  const [sellCampus, setSellCampus] = useState('Bihta Campus');
  const [sellHostel, setSellHostel] = useState('Nagarjuna Hostel');
  const [sellRoom, setSellRoom] = useState('507');
  const [sellPhone, setSellPhone] = useState('7080730503');
  const [sellToast, setSellToast] = useState('');

  // MY LISTINGS DEMO STATE
  const [listingsView, setListingsView] = useState('empty'); // 'empty' or 'active'
  const [demoListings, setDemoListings] = useState([
    {
      id: 1,
      title: 'Milton 1L Hot Electric Kettle',
      price: 450,
      category: 'Hostel Appliances',
      condition: 'Gently Used',
      location: 'Bihta Campus • Nagarjuna Hostel Rm 507',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 2,
      title: 'Casio fx-991EX Classwiz Scientific Calculator',
      price: 550,
      category: 'Books & Study Material',
      condition: 'Like New',
      location: 'Patna Campus • Brahmaputra Hostel Rm 314',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=300&q=80',
    },
  ]);

  // GLOBAL CHAT DEMO STATE
  const [globalMessages, setGlobalMessages] = useState([
    {
      id: 1,
      sender: 'Rohan Sharma',
      hostel: 'Brahmaputra Hostel (Rm 314)',
      text: 'Welcome to Campus Community Global Chat!',
      time: '22:47',
      isMe: false,
    },
    {
      id: 2,
      sender: 'Ananya Verma',
      hostel: 'Ganga Girls Hostel (Rm 204)',
      text: 'Anyone selling Engineering Mathematics Vol 2 or Milton hot kettle?',
      time: '23:15',
      isMe: false,
    },
    {
      id: 3,
      sender: 'You',
      hostel: 'Nagarjuna Hostel (Rm 507)',
      text: 'djak',
      time: '00:13',
      isMe: true,
    },
  ]);
  const [globalInput, setGlobalInput] = useState('');

  // DIRECT CHATS (P2P) DEMO STATE
  const [p2pActiveConv, setP2pActiveConv] = useState('fazal'); // 'fazal' or null
  const [p2pInput, setP2pInput] = useState('');
  const [p2pMessages, setP2pMessages] = useState([
    {
      id: 1,
      sender: 'You',
      text: 'Hi Fazal, is the pilot pen still available in Nagarjuna Hostel?',
      time: '18 Nov 14:20',
      isMe: true,
    },
    {
      id: 2,
      sender: 'Fazal Khan',
      text: 'mam',
      time: '18 Nov 14:22',
      isMe: false,
    },
    {
      id: 3,
      sender: 'Fazal Khan',
      text: 'Yes! Room 507, come after 5 PM.',
      time: '18 Nov 14:23',
      isMe: false,
    },
  ]);

  // PROFILE DEMO STATE
  const [profileName, setProfileName] = useState('Apoorv Sharma');
  const [profileCampus, setProfileCampus] = useState('Bihta Campus');
  const [profileHostel, setProfileHostel] = useState('Nagarjuna Hostel');
  const [profileRoom, setProfileRoom] = useState('507');
  const [profilePhone, setProfilePhone] = useState('7080730503');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Handlers
  const handlePublishSellDemo = (e) => {
    e.preventDefault();
    setSellToast('🎉 Demo item published! Sign in with your @nitp.ac.in ID to list real items for 2,000+ hostellers.');
    setTimeout(() => setSellToast(''), 6000);
  };

  const handleSendGlobalDemo = (e) => {
    e.preventDefault();
    if (!globalInput.trim()) return;

    const newM = {
      id: Date.now(),
      sender: 'You',
      hostel: `${sellHostel} (Rm ${sellRoom})`,
      text: globalInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setGlobalMessages((prev) => [...prev, newM]);
    setGlobalInput('');

    // Automated simulated reply
    setTimeout(() => {
      setGlobalMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'Campus Bot (Demo)',
          hostel: 'NIT Patna System',
          text: '✨ Message received! Once you log in, all live hostellers across Patna & Bihta see your broadcasts.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
        },
      ]);
    }, 1200);
  };

  const handleSendP2pDemo = (e) => {
    e.preventDefault();
    if (!p2pInput.trim()) return;

    const newM = {
      id: Date.now(),
      sender: 'You',
      text: p2pInput.trim(),
      time: 'Just now',
      isMe: true,
    };
    setP2pMessages((prev) => [...prev, newM]);
    setP2pInput('');

    setTimeout(() => {
      setP2pMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'Fazal Khan',
          text: 'Deal! See you at the hostel lobby.',
          time: 'Just now',
          isMe: false,
        },
      ]);
    }, 1400);
  };

  const handleSaveProfileDemo = (e) => {
    e.preventDefault();
    setProfileSavedMsg('✅ Demo Profile updated successfully! Sign in to sync your official campus details.');
    setTimeout(() => setProfileSavedMsg(''), 5000);
  };

  const availableSellHostels = getHostelsForCampus(sellCampus);

  return (
    <section className="mt-10 mb-8 animate-in fade-in duration-300 w-full">
      {/* Full-width Options Menu for Demo */}
      <div className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col items-center justify-center text-center space-y-4">
        {/* Larger Centered Heading (No Icon) */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Explore more features
        </h3>

        {/* Option Tabs Centered Below Heading */}
        <div className="flex items-center justify-center flex-wrap gap-2 w-full">
          {[
            { id: 'sell', label: 'Sell Item', icon: PlusCircle },
            { id: 'listings', label: 'My Listings', icon: Package },
            { id: 'global-chat', label: 'Global Chat', icon: Globe },
            { id: 'p2p-chat', label: 'Direct Chats (P2P)', icon: MessageSquare },
            { id: 'profile', label: 'Student Profile', icon: User },
            { id: 'all', label: 'View All Showcase', icon: SlidersHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/40 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-12">
        {/* ========================================================= */}
        {/* 1. SELL ITEM (LIST ITEM ON CAMPUS) DEMO */}
        {/* ========================================================= */}
        {(activeTab === 'sell' || activeTab === 'all') && (
          <div className="relative max-w-4xl mx-auto bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
            {/* Simulated Sell Page Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  List Item on Campus
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hostellers can find and purchase your item directly
                </p>
              </div>
            </div>

            {sellToast && (
              <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in">
                <span>{sellToast}</span>
                <Link
                  to="/login"
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500"
                >
                  Sign In Live
                </Link>
              </div>
            )}

            {/* Interactive Sell Form */}
            <form onSubmit={handlePublishSellDemo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  ITEM TITLE *
                </label>
                <input
                  type="text"
                  value={sellTitle}
                  onChange={(e) => setSellTitle(e.target.value)}
                  placeholder="e.g. Cello 1L Water Bottle, Milton Hot Kettle, Scientific Calculator"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    CATEGORY *
                  </label>
                  <select
                    value={sellCategory}
                    onChange={(e) => setSellCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="Hostel Appliances">Hostel Appliances</option>
                    <option value="Books">Books & Notes</option>
                    <option value="Electronics & Cables">Electronics & Cables</option>
                    <option value="Cycles & Mobility">Cycles & Mobility</option>
                    <option value="Bedding & Mattress">Bedding & Mattress</option>
                    <option value="Food & Munchies">Food & Munchies</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    CONDITION *
                  </label>
                  <select
                    value={sellCondition}
                    onChange={(e) => setSellCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="Brand New (Unopened)">Brand New (Unopened)</option>
                    <option value="Gently Used (Good working condition)">Gently Used (Good condition)</option>
                    <option value="Fair Condition">Fair Condition</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    PRICE (₹) *
                  </label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Pickup Location Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 font-bold">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span className="uppercase tracking-wider text-[11px]">ACTUAL PRODUCT PICKUP LOCATION</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Prefilled from profile (editable)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Pickup Campus *
                    </label>
                    <select
                      value={sellCampus}
                      onChange={(e) => {
                        setSellCampus(e.target.value);
                        const h = getHostelsForCampus(e.target.value);
                        if (h.length > 0) setSellHostel(h[0].name);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                    >
                      {ALL_CAMPUSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Pickup Hostel *
                    </label>
                    <select
                      value={sellHostel}
                      onChange={(e) => setSellHostel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                    >
                      {availableSellHostels.map((h) => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Room No. *
                    </label>
                    <input
                      type="text"
                      value={sellRoom}
                      onChange={(e) => setSellRoom(e.target.value)}
                      placeholder="# 507"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="text"
                      value={sellPhone}
                      onChange={(e) => setSellPhone(e.target.value)}
                      placeholder="7080730503"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Test Publish Listing (Demo)</span>
                </button>

                <Link
                  to="/login?tab=nitp-student"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-center transition-all flex items-center justify-center space-x-1"
                >
                  <span>Sign In with College ID to Sell Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. MY PRODUCT LISTINGS DEMO */}
        {/* ========================================================= */}
        {(activeTab === 'listings' || activeTab === 'all') && (
          <div className="relative max-w-4xl mx-auto bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  My Product Listings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage your active and sold campus listings ({listingsView === 'empty' ? '0' : demoListings.length} items)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setListingsView('empty')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      listingsView === 'empty'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Empty State
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingsView('active')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      listingsView === 'active'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Active Items ({demoListings.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('sell')}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add New Listing</span>
                </button>
              </div>
            </div>

            {/* Empty State Box (Matching Screenshot 2) */}
            {listingsView === 'empty' ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 max-w-lg mx-auto p-8 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-500 mb-4 shadow-sm">
                  <Package className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  You haven't listed any items yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                  Selling semester notes, a kettle, or a cycle? Put them up for other hostellers!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('sell')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              /* Active Listings Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                {demoListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex space-x-4 items-center"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {item.status}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.location}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          ₹{item.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDemoListings((prev) =>
                              prev.map((p) =>
                                p.id === item.id ? { ...p, status: p.status === 'Active' ? 'Sold' : 'Active' } : p
                              )
                            );
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        >
                          Toggle {item.status === 'Active' ? 'Mark Sold' : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. CAMPUS COMMUNITY GLOBAL CHAT DEMO */}
        {/* ========================================================= */}
        {(activeTab === 'global-chat' || activeTab === 'all') && (
          <div className="relative max-w-4xl mx-auto bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
            {/* Global Chat Header (Matching Screenshot 3) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Campus Community Global Chat
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>1 Active Online</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {globalMessages.length}/100 messages • Resets at 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time discussions, marketplace inquiries, hostel queries & notices across NIT Patna
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto shrink-0 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Visible to all registered students & sellers</span>
              </span>
            </div>

            {/* Chat Stream Window */}
            <div className="h-64 overflow-y-auto p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              {globalMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${m.isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {m.sender[0]}
                  </div>
                  <div className={`max-w-[75%] ${m.isMe ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-0.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{m.sender}</span>
                      <span>• {m.hostel}</span>
                    </div>
                    <div
                      className={`inline-block p-3 rounded-2xl text-xs ${
                        m.isMe
                          ? 'bg-amber-600 text-white rounded-tr-xs shadow-md shadow-amber-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className={`text-[9px] mt-1 block opacity-75 ${m.isMe ? 'text-amber-100' : 'text-slate-400'}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Bar (Matching Screenshot 3) */}
            <form onSubmit={handleSendGlobalDemo} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={globalInput}
                onChange={(e) => setGlobalInput(e.target.value)}
                placeholder="Broadcast a message to everyone on campus (questions, offers, items wanted)..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-600/30 transition-all shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. DIRECT CHATS (P2P CHAT) DEMO */}
        {/* ========================================================= */}
        {(activeTab === 'p2p-chat' || activeTab === 'all') && (
          <div className="relative max-w-4xl mx-auto bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
            {/* Sub-header navigation tabs (Matching Screenshot 4) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-4 text-xs font-bold">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('global-chat')}
                  className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center space-x-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Campus Global Chat</span>
                </button>
                <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Chats (P2P)</span>
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">1</span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>1 Registered User Active</span>
              </span>
            </div>

            {/* Split Chat Box (Matching Screenshot 4) */}
            <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[340px]">
              {/* Left Column: Direct Purchases List */}
              <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">
                      Direct Purchases
                    </h5>
                    <p className="text-[10px] text-slate-500">Buyer-to-Seller private messaging</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                    1 Active
                  </span>
                </div>

                {/* Conversation Card item (Fazal Khan) */}
                <button
                  type="button"
                  onClick={() => setP2pActiveConv('fazal')}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 ${
                    p2pActiveConv === 'fazal'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                      alt="Fazal Khan"
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Fazal Khan
                      </span>
                      <span className="text-[10px] text-slate-400">18 Nov</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Nagarjuna Hostel • Offline</p>
                    <div className="mt-1">
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                        <Package className="w-2.5 h-2.5" />
                        <span>Pen ₹10</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      mam
                    </p>
                  </div>
                </button>
              </div>

              {/* Right Column: Active Conversation */}
              <div className="md:col-span-8 flex flex-col bg-white dark:bg-slate-900 justify-between p-4">
                {p2pActiveConv ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          FK
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              Fazal Khan
                            </h5>
                            <span className="text-[10px] text-slate-400">(Nagarjuna Hostel Rm 507)</span>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-medium">Discussing: Pen ₹10</span>
                        </div>
                      </div>
                      <Link
                        to="/login"
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:underline"
                      >
                        Sign In to Connect
                      </Link>
                    </div>

                    {/* Messages */}
                    <div className="py-4 space-y-2.5 overflow-y-auto max-h-48">
                      {p2pMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`p-2.5 rounded-2xl max-w-[80%] text-xs ${
                              m.isMe
                                ? 'bg-indigo-600 text-white rounded-tr-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                            }`}
                          >
                            <p>{m.text}</p>
                            <span className={`text-[9px] mt-0.5 block opacity-70 ${m.isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {m.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendP2pDemo} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={p2pInput}
                        onChange={(e) => setP2pInput(e.target.value)}
                        placeholder="Write a message to Fazal Khan..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1"
                      >
                        <span>Send</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-16 m-auto">
                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Select a Conversation
                    </h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Chat with hostellers in real-time to discuss product condition, price negotiation, and pickup spots.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. STUDENT & SELLER PROFILE DEMO */}
        {/* ========================================================= */}
        {(activeTab === 'profile' || activeTab === 'all') && (
          <div className="relative max-w-4xl mx-auto bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
            {profileSavedMsg && (
              <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-bold">
                {profileSavedMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Profile Card Preview */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80 text-center space-y-3">
                <div className="relative inline-block">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                    alt="Apoorv Sharma"
                    className="w-20 h-20 rounded-3xl object-cover mx-auto ring-4 ring-indigo-500/30 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {profileName}
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                    apoorv.sharma@nitp.ac.in
                  </p>
                </div>

                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>NIT Patna Hosteller Verified</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Campus:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{profileCampus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hostel:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{profileHostel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Room:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">#{profileRoom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">+91 {profilePhone}</span>
                  </div>
                </div>
              </div>

              {/* Right Profile Edit Form (Interactive) */}
              <form onSubmit={handleSaveProfileDemo} className="md:col-span-7 space-y-3.5 text-xs">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Update Hosteller Contact & Location
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Campus
                    </label>
                    <select
                      value={profileCampus}
                      onChange={(e) => {
                        setProfileCampus(e.target.value);
                        const h = getHostelsForCampus(e.target.value);
                        if (h.length > 0) setProfileHostel(h[0].name);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {ALL_CAMPUSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Hostel
                    </label>
                    <select
                      value={profileHostel}
                      onChange={(e) => setProfileHostel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {getHostelsForCampus(profileCampus).map((h) => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={profileRoom}
                      onChange={(e) => setProfileRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      WhatsApp / Phone
                    </label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
                  >
                    Save Changes (Demo)
                  </button>
                  <Link
                    to="/login"
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Log In to Sync Official Profile
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Call-to-Action for Not-Logged-In Users */}
      <div className="max-w-4xl mx-auto mt-12 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              NIT PATNA ONLY
            </span>
            <span className="text-xs text-indigo-300 font-medium">Patna & Bihta Hostels</span>
          </div>
          <h4 className="text-lg sm:text-xl font-extrabold text-white">
            Ready to trade, chat, and sell across campus?
          </h4>
          <p className="text-xs text-indigo-200/80 max-w-lg">
            Create your account with your official <code className="text-white font-bold">@nitp.ac.in</code> email in 30 seconds. Commercial sellers can subscribe via Razorpay.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs shadow-lg shadow-indigo-500/30 text-center transition-all flex items-center justify-center space-x-1.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Register NITP ID</span>
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 text-center transition-all"
          >
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GuestFeatureShowcase;
