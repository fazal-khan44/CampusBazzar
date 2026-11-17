import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Zap,
  Package,
  Check,
  ArrowRight,
  Dumbbell,
} from 'lucide-react';

const SLIDES = [
  {
    id: 'campus',
    icon: MapPin,
    title: 'Dual Campus Network',
    subtitle: 'Patna & Bihta Campuses',
    description:
      'Buy and sell across both Ashok Rajpath (Patna) and Bihta permanent campuses with hostel-level delivery.',
    points: [
      'Filtered across all 12 NITP Hostels',
      'Proximity matching to find items nearest your room',
      'Safe on-campus room-to-room exchanges',
    ],
    actionText: 'Browse Campus Listings',
    actionLink: '/',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Instant Student Chat',
    subtitle: 'Real-Time Messaging',
    description:
      'Chat directly with buyers and sellers in real-time with instant notifications and deal negotiation.',
    points: [
      '1-on-1 private deal chats on every listing',
      'Global Campus Chat channel for all hostellers',
      'Live online user presence counter',
    ],
    actionText: 'Open Global Chat',
    actionLink: '/chat?tab=global',
  },
  {
    id: 'verify',
    icon: ShieldCheck,
    title: 'Verified NITP Community',
    subtitle: 'Safe & Trusted Peers',
    description:
      'Built exclusively for verified students and sellers of NIT Patna. No outsiders, only trusted peers.',
    points: [
      'Official campus student domain verification',
      'Verified roll numbers and hostel room details',
      'Meet safely in campus common rooms or canteens',
    ],
    actionText: 'Create Verified Listing',
    actionLink: '/create-listing',
  },
  {
    id: 'sell',
    icon: Zap,
    title: 'Zero Fees & Quick Listing',
    subtitle: '100% Free for Students',
    description:
      'List used cycles, books, coolers, kettles, and mattresses in under a minute with zero commissions.',
    points: [
      'Quick multi-image upload with instant preview',
      'Simple condition tagging from Brand New to Used',
      'Mark as Sold anytime with a single click',
    ],
    actionText: 'List an Item Now',
    actionLink: '/create-listing',
  },
  {
    id: 'sports',
    icon: Dumbbell,
    title: 'Sports & Gym Accessories',
    subtitle: 'Hostel Fitness & Sports Gear',
    description:
      'Buy and sell gym gear, dumbbells, badminton rackets, cricket kits, and yoga mats with fellow hostellers.',
    points: [
      'Dumbbells, resistance bands, and workout accessories',
      'Badminton rackets, cricket bats, footballs and kits',
      'Trade directly with hostel sports players and gym peers',
    ],
    actionText: 'Browse Sports & Gym Gear',
    actionLink: '/?category=Sports%20%26%20Gym%20Accessories',
  },
  {
    id: 'categories',
    icon: Package,
    title: 'Hostel Essentials & Notes',
    subtitle: 'Senior-to-Junior Passing',
    description:
      'Tailored specifically for campus survival so you easily find what seniors pass down each semester.',
    points: [
      'Semester PYQs, handwritten notes and textbooks',
      'Hostel kettles, coolers, and daily appliances',
      'Sports equipment, cycles and hostel mobility gear',
    ],
    actionText: 'Explore Categories',
    actionLink: '/',
  },
];

const FeaturesModal = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation: Left, Right, Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, currentIndex, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Cards Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-modal-pop flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              CampusBazzar Features
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({currentIndex + 1}/{SLIDES.length})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliding Card Carousel Viewport */}
        <div className="overflow-hidden relative w-full">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {SLIDES.map((slide) => {
              const Icon = slide.icon;
              return (
                <div
                  key={slide.id}
                  className="w-full shrink-0 px-6 sm:px-8 py-8 flex flex-col items-center text-center"
                >
                  {/* Clean Minimal Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {slide.title}
                  </h3>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                    {slide.subtitle}
                  </span>

                  {/* Short Description */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                    {slide.description}
                  </p>

                  {/* Clean Points List */}
                  <div className="w-full max-w-sm space-y-2 text-left bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-6">
                    {slide.points.map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  {/* Single Clean Action Link */}
                  <Link
                    to={slide.actionLink}
                    onClick={onClose}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all hover:scale-102 active:scale-95"
                  >
                    <span>{slide.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simple Bottom Controls: Prev, Dots, Next */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
          {/* Previous Slide Button */}
          <button
            onClick={prevSlide}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Previous Feature"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Dot Indicators */}
          <div className="flex items-center space-x-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-500'
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Slide Button */}
          <button
            onClick={nextSlide}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Next Feature"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FeaturesModal;
