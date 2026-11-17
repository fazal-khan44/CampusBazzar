import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import {
  Sun,
  Moon,
  PlusCircle,
  User,
  LogOut,
  Package,
  MessageSquare,
  Globe,
  ChevronDown,
  HelpCircle,
  LogIn,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { onlineCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const timeoutRef = useRef(null);
  const menuContainerRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 180);
  };

  const closeMenu = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    const confirmed = window.confirm('Do you want to logout?');
    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  const isSellActive = location.pathname === '/create-listing';
  const isHomeActive = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Highlighted when on Home page */}
        <Link
          to="/"
          className={`flex items-center space-x-2.5 px-3 py-1.5 -ml-2 rounded-2xl transition-all duration-200 active:scale-95 group ${
            isHomeActive
              ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 dark:border-indigo-500/35 shadow-xs backdrop-blur-sm'
              : 'border border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
          title="CampusBazzar Home"
        >
          <img
            src="/logo.png"
            alt="CampusBazzar"
            className="h-10 w-10 rounded-xl object-cover shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow"
          />
          <div>
            <span className="text-xl font-bold">
              <span className="text-[#1a2f5a] dark:text-white">Campus</span>
              <span className="text-orange-500">Bazzar</span>
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold -mt-1">
              Student-to-Student Marketplace
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 animate-fade-in" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600 animate-fade-in" />
            )}
          </button>

          {user ? (
            <>
              {/* Sell an Item button */}
              <Link
                to="/create-listing"
                className={`hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isSellActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/50'
                    : 'bg-indigo-600/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Item</span>
              </Link>

              {/* My Listings link */}
              <NavLink
                to="/my-listings"
                className={({ isActive }) =>
                  `hidden md:flex px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 items-center space-x-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
                title="My Listings"
              >
                {({ isActive }) => (
                  <>
                    <Package
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`}
                    />
                    <span>My Listings</span>
                  </>
                )}
              </NavLink>

              {/* Global Campus Chat Link with Active Users Count */}
              <NavLink
                to="/chat?tab=global"
                className={
                  location.pathname === '/chat' && location.search.includes('tab=global')
                    ? 'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
                title="Global Campus Chat"
              >
                <Globe className="w-4 h-4 text-orange-500" />
                <span className="hidden md:inline">Global Chat</span>
                {onlineCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                    {onlineCount}
                  </span>
                )}
              </NavLink>

              {/* Live Chats Link */}
              <NavLink
                to="/chat"
                className={
                  location.pathname === '/chat' && !location.search.includes('tab=global')
                    ? 'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
                title="Direct Chats"
              >
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span className="hidden md:inline">Chats</span>
              </NavLink>

              {/* User Dropdown Menu (on hover) */}
              <div
                ref={menuContainerRef}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-2xl transition-all duration-200 flex items-center space-x-2 border group ${
                    location.pathname === '/profile'
                      ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <div className="relative">
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || 'User'
                        )}&background=F27A1A&color=fff&size=80`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="hidden xl:flex flex-col text-left pr-0.5">
                    <span className="text-xs font-bold leading-tight truncate max-w-[110px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-none mt-0.5">
                      Account
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      menuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu for Logged In User */}
                {menuOpen && (
                  <div className="absolute right-0 top-full pt-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="w-56 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-1.5 ring-1 ring-black/5 focus:outline-none">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user.email || 'Campus User'}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        to="/my-listings"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        role="menuitem"
                      >
                        <Package className="w-4 h-4 text-indigo-500" />
                        <span>My Listings</span>
                      </Link>

                      {user?.email?.toLowerCase() === 'campusbazzar4@gmail.com' && (
                        <Link
                          to="/admin/subscriptions"
                          onClick={closeMenu}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          role="menuitem"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <span>Admin: Subscriptions</span>
                        </Link>
                      )}

                      <a
                        href="mailto:campusbazzar4@gmail.com"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700/70 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        role="menuitem"
                      >
                        <HelpCircle className="w-4 h-4 text-orange-500" />
                        <span>Help & Support</span>
                      </a>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              ref={menuContainerRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Login Button with Hover Dropdown */}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border group ${
                  location.pathname === '/login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/50 border-indigo-600'
                    : 'bg-indigo-600/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border-indigo-200 dark:border-indigo-800'
                }`}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <User className="w-4 h-4" />
                <span>Login</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu for Guest User */}
              {menuOpen && (
                <div className="absolute right-0 top-full pt-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="w-56 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-1.5 ring-1 ring-black/5 focus:outline-none">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      role="menuitem"
                    >
                      <LogIn className="w-4 h-4 text-indigo-500" />
                      <span>Register / Sign In</span>
                    </Link>

                    <a
                      href="mailto:campusbazzar4@gmail.com"
                      onClick={closeMenu}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700/70 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      role="menuitem"
                    >
                      <HelpCircle className="w-4 h-4 text-orange-500" />
                      <span>Help & Support</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
