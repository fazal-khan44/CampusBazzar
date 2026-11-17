import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to search input or navigate home and focus search
  const handleSearchShortcut = () => {
    if (location.pathname !== '/') {
      navigate('/?focus=search');
      return;
    }

    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        searchInput.focus();
      }, 350);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSearchShortcut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname]);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-medium">
        <span>© 2026 CampusBazzar</span>
        <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
        <span>Student-to-Student Marketplace</span>
        <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
        <span>NIT Patna</span>
        <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
        <button
          type="button"
          onClick={handleSearchShortcut}
          className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors cursor-pointer"
        >
          Search
        </button>
        <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
        {user ? (
          <Link
            to="/profile"
            className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
          >
            My Account
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
          >
            Login / Register
          </Link>
        )}
        <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
        <a
          href="mailto:campusbazzar4@gmail.com?subject=CampusBazzar%20Support%20Inquiry"
          className="text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 hover:underline transition-colors"
        >
          Help & Support
        </a>
        <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
        <button
          type="button"
          onClick={handleScrollTop}
          className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors cursor-pointer"
        >
          Top
        </button>
      </div>
    </footer>
  );
};

export default Footer;
