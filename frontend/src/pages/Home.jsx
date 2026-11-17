import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import GuestFeatureShowcase from '../components/home/GuestFeatureShowcase';
import { PRESET_CATEGORIES } from '../utils/categories';
import { useAuth } from '../context/AuthContext';
import {
  ALL_CAMPUSES,
  getHostelsForCampus,
  CAMPUS_NAMES,
  isGirlsHostelName,
} from '../utils/nitpLocations';
import {
  Search,
  PackageX,
  Sparkles,
  Layers,
  ArrowUpDown,
  Tag,
  PlusCircle,
  BookOpen,
  FileText,
  UtensilsCrossed,
  Coffee,
  CupSoda,
  Scissors,
  Zap,
  Smartphone,
  Bike,
  Bed,
  Shirt,
  MapPin,
  Building,
  Dumbbell,
} from 'lucide-react';

const iconMap = {
  BookOpen,
  FileText,
  UtensilsCrossed,
  Coffee,
  CupSoda,
  Scissors,
  Zap,
  Smartphone,
  Bike,
  Bed,
  Shirt,
  Layers,
  Dumbbell,
};

const Home = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');

  // Check URL query param for category
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [location.search]);

  // Location filter states
  const [selectedCampus, setSelectedCampus] = useState('All');
  const [selectedHostel, setSelectedHostel] = useState('All');
  const [quickFilter, setQuickFilter] = useState('all'); // 'my-hostel', 'my-campus', 'other-hostels', 'all'

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = [];
      if (search.trim()) query.push(`keyword=${encodeURIComponent(search)}`);
      if (selectedCategory !== 'All')
        query.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedCondition !== 'All')
        query.push(`condition=${encodeURIComponent(selectedCondition)}`);

      // Campus and Hostel filtering
      if (quickFilter !== 'all') {
        query.push(`quickFilter=${quickFilter}`);
      } else {
        if (selectedCampus !== 'All') {
          query.push(`campus=${encodeURIComponent(selectedCampus)}`);
        }
        if (selectedHostel !== 'All') {
          query.push(`hostel=${encodeURIComponent(selectedHostel)}`);
        }
      }

      // Pass buyer details for relevance sorting (my hostel > my campus > other campus)
      if (user) {
        if (user.campus) query.push(`buyerCampus=${encodeURIComponent(user.campus)}`);
        const userHostel = user.hostel || user.hostelName;
        if (userHostel) query.push(`buyerHostel=${encodeURIComponent(userHostel)}`);
      }

      const queryString = query.length > 0 ? `?${query.join('&')}` : '';
      const { data } = await api.get(`/products${queryString}`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [
    search,
    selectedCategory,
    selectedCondition,
    selectedCampus,
    selectedHostel,
    quickFilter,
    user,
  ]);

  const handleCampusFilterChange = (e) => {
    const val = e.target.value;
    setSelectedCampus(val);
    setSelectedHostel('All');
    setQuickFilter('all');
  };

  const handleHostelFilterChange = (e) => {
    setSelectedHostel(e.target.value);
    setQuickFilter('all');
  };

  const handleQuickFilterClick = (type) => {
    if (quickFilter === type) {
      setQuickFilter('all');
    } else {
      setQuickFilter(type);
      setSelectedCampus('All');
      setSelectedHostel('All');
    }
  };

  // Sort helper
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0; // relevance is already ordered by backend
  });

  const availableHostels =
    selectedCampus !== 'All' ? getHostelsForCampus(selectedCampus) : [];

  const productCategories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  const presetIds = PRESET_CATEGORIES.map((c) => c.id);
  const legacyAliases = [
    'Food & Munchies',
    'Bottles & Sippers',
    'Hostel Appliances',
    'Electronics & Cables',
    'Cycles & Mobility',
    'Bedding & Furniture',
    'Bedding & Mattress',
    'Clothing & Lab Coats',
    'Notes & Study Material',
    'Stationery & Small Accessories',
    'Stationery & Accessories',
  ];
  const customCategories = productCategories.filter(
    (c) => !presetIds.includes(c) && !legacyAliases.includes(c)
  );

  const userHostelDisplay = user ? user.hostel || user.hostelName : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-transparent dark:from-indigo-950/20 dark:via-slate-900 dark:to-transparent border-b border-slate-200/60 dark:border-slate-800/60 pt-8 pb-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Buy & Sell across{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              Patna & Bihta
            </span>{' '}
            Campuses
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Trade books, notes, snacks, appliances, and cycles across all 12 NITP hostels.
          </p>

          {/* Search Box Bar */}
          <div className="mt-6 max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description (e.g. calculator, kettle, bottle, notes)..."
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-slate-100 text-sm transition-all"
            />
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Campus & Hostel Location Controls */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Location & Campus Filters
              </h2>
            </div>

            {/* Quick Filter Buttons: Only My Hostel & My Campus */}
            {user && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleQuickFilterClick('my-hostel')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                    quickFilter === 'my-hostel'
                      ? 'bg-indigo-600 text-white shadow-xs scale-102 ring-2 ring-indigo-500/50'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  }`}
                >
                  <span>🏠 My Hostel</span>
                  {userHostelDisplay && (
                    <span className="opacity-80 font-normal">({userHostelDisplay})</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFilterClick('my-campus')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                    quickFilter === 'my-campus'
                      ? 'bg-indigo-600 text-white shadow-xs scale-102 ring-2 ring-indigo-500/50'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  }`}
                >
                  <span>📍 My Campus</span>
                  {user.campus && (
                    <span className="opacity-80 font-normal">({user.campus})</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Campus & Hostel Dropdowns: ONLY Campus & Hostel Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Campus Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Campus Filter
              </label>
              <select
                value={selectedCampus}
                onChange={handleCampusFilterChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="All">All Campuses (Patna & Bihta)</option>
                {ALL_CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Hostel Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Hostel Filter
              </label>
              <select
                value={selectedHostel}
                onChange={handleHostelFilterChange}
                disabled={selectedCampus === 'All'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
              >
                <option value="All">
                  {selectedCampus === 'All'
                    ? 'Select Campus First'
                    : `All Hostels in ${selectedCampus}`}
                </option>
                {availableHostels.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} {h.isGirlsHostel ? '🌸 (Girls)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dedicated Category Exploration Section (Flipkart / Blinkit Style with Medium Icons & Name Below) */}
        <div className="mb-8 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>Categories</span>
              </h2>
            </div>

            <Link
              to="/create-listing"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/60 transition-all hover:shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Custom Category</span>
            </Link>
          </div>

          {/* Category Scroller: Icon on Top, Name Below (Generous Top Padding to Prevent Overlapping) */}
          <div className="flex items-start justify-start sm:justify-between gap-3 sm:gap-5 overflow-x-auto pt-3 sm:pt-4 pb-2.5 scrollbar-none">
            {/* All Items */}
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="flex flex-col items-center justify-center flex-shrink-0 group cursor-pointer focus:outline-none min-w-[64px] sm:min-w-[72px] py-1"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  selectedCategory === 'All'
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-105'
                }`}
              >
                <Layers className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110" />
              </div>
              <span
                className={`text-xs sm:text-[13px] font-semibold mt-2.5 text-center transition-colors line-clamp-1 ${
                  selectedCategory === 'All'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}
              >
                All Items
              </span>
              {selectedCategory === 'All' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1" />
              )}
            </button>

            {/* Preset Categories */}
            {PRESET_CATEGORIES.map((cat) => {
              const IconComponent = iconMap[cat.icon] || Tag;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center justify-center flex-shrink-0 group cursor-pointer focus:outline-none min-w-[64px] sm:min-w-[72px] py-1"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-105'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110" />
                  </div>
                  <span
                    className={`text-xs sm:text-[13px] font-semibold mt-2.5 text-center transition-colors line-clamp-1 ${
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {cat.name}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1" />
                  )}
                </button>
              );
            })}

            {/* Custom Categories */}
            {customCategories.map((customCat) => {
              const isSelected = selectedCategory === customCat;
              return (
                <button
                  key={customCat}
                  type="button"
                  onClick={() => setSelectedCategory(customCat)}
                  className="flex flex-col items-center justify-center flex-shrink-0 group cursor-pointer focus:outline-none min-w-[64px] sm:min-w-[72px] py-1"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 group-hover:scale-105'
                    }`}
                  >
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110" />
                  </div>
                  <span
                    className={`text-xs sm:text-[13px] font-semibold mt-2.5 text-center transition-colors line-clamp-1 ${
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {customCat}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listing Stats & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              Showing <strong className="text-slate-900 dark:text-slate-100">{sortedProducts.length}</strong> items
              {user && ' • Prioritized for your hostel & campus'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="relevance">Hostel Relevance (Nearest First)</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-4"
              >
                <div className="aspect-4/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3 pt-4" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto p-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-500 mb-4">
              <PackageX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              No items found in selected location
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Try choosing "All Campuses" or be the first hosteller to list an item in this location!
            </p>
            <Link
              to="/create-listing"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List an Item Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {sortedProducts.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        )}

        {/* Live Feature Showcase Demo for Non-Logged-In Users */}
        {!user && <GuestFeatureShowcase />}
      </main>
    </div>
  );
};

export default Home;
