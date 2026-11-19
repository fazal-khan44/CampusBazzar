import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, MapPin, Building2, ArrowUpRight, Eye, Sparkles } from 'lucide-react';
import { normalizeCategory } from '../../utils/categories';
import { useAuth } from '../../context/AuthContext';

const ProductCard = ({ product, index = 0 }) => {
  const { user } = useAuth();
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const conditionColors = {
    'Brand New': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    'Like New': 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    'Gently Used': 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    'Heavily Used': 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700',
  };

  const defaultImg =
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  const displayImage =
    product.images && product.images.length > 0 ? product.images[0] : defaultImg;

  const hostel = product.hostel || product.hostelName || 'Hostel';
  const campus = product.campus || 'NIT Patna';

  return (
    <Link
      to={`/products/${product._id}`}
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
      className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 transition-all duration-300 ease-out hover:-translate-y-1 sm:hover:-translate-y-2 animate-card-in"
    >
      {/* Hover Diagonal Light Beam Sweep */}
      <div className="shine-overlay z-20 pointer-events-none" />

      {/* Product Image Cover Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={displayImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = defaultImg;
          }}
        />

        {/* Ambient Dark Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 opacity-40 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

        {/* Condition Tag Badge with Glow */}
        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10 transition-transform duration-300 group-hover:scale-105">
          <span
            className={`inline-flex items-center space-x-0.5 sm:space-x-1 text-[8px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-xl border shadow-2xs backdrop-blur-md transition-all ${
              conditionColors[product.condition] ||
              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 opacity-70 hidden sm:inline" />
            <span className="truncate max-w-[65px] sm:max-w-none">{product.condition}</span>
          </span>
        </div>

        {/* Status Badge */}
        {product.status !== 'Available' ? (
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-10">
            <span className="text-[8px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-xl bg-rose-600/95 text-white shadow-md backdrop-blur-sm animate-pulse">
              {product.status}
            </span>
          </div>
        ) : (
          /* Subtle Campus Badge (Desktop only) */
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/20">
              {campus.includes('Bihta') ? 'Bihta Campus' : 'Patna Campus'}
            </span>
          </div>
        )}

        {/* Interactive "View Item" Action Pill - Slides up smoothly on hover (Desktop only) */}
        <div className="hidden sm:block absolute bottom-3 inset-x-3 z-10 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-900/90 dark:bg-indigo-600/90 text-white text-xs font-bold shadow-xl backdrop-blur-md border border-white/20">
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-2 sm:p-4 md:p-5 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900 transition-colors">
        <div>
          {/* Category Chip */}
          <div className="flex items-center text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-0.5 sm:mb-1.5">
            <div className="inline-flex items-center space-x-1 truncate max-w-full">
              <Tag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">{normalizeCategory(product.category)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-base font-bold sm:font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-orange-500 dark:group-hover:from-indigo-400 dark:group-hover:to-orange-400 transition-all duration-300">
            {product.title}
          </h3>

          {/* Description snippet - visible on tablet/desktop */}
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Location Section */}
        <div className="mt-1.5 sm:mt-3.5 py-1 sm:py-2 px-1.5 sm:px-3 rounded-lg sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 group-hover:border-indigo-200/60 dark:group-hover:border-indigo-800/60 group-hover:bg-indigo-50/40 dark:group-hover:bg-indigo-950/20 transition-all duration-300 space-y-0.5 text-[9px] sm:text-[11px]">
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-indigo-600 dark:text-indigo-400 font-bold truncate">
            <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{campus}</span>
          </div>
          {user && (
            <div className="flex items-center space-x-1 sm:space-x-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
              <Building2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{hostel}</span>
            </div>
          )}
        </div>

        {/* Price & Pickup Spot Footer */}
        <div className="mt-1.5 sm:mt-3.5 pt-1.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="transition-transform duration-300 origin-left group-hover:scale-105 min-w-0">
            <span className="text-xs sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight block truncate">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 opacity-90 group-hover:opacity-100 transition-opacity">
            <span>Instant Deal</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
