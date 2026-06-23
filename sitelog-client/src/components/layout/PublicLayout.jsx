import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import PlinthLogo from '../common/PlinthLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Switch from '../ui/sky-toggle';
import ParticleBackground from '../common/ParticleBackground';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Sitemap', path: '/sitemap' }
];

function PublicNavbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-4 z-50 mx-auto max-w-7xl w-full px-4 lg:px-8 pt-4 pointer-events-none">
      <div className="relative w-full pointer-events-auto">
        <div className="liquid-glass grid grid-cols-2 md:grid-cols-3 items-center rounded-2xl px-6 py-3">
          <div className="flex justify-start">
            <Link to="/"><PlinthLogo size="xxs" /></Link>
          </div>
          
          <div className="hidden md:flex justify-end md:col-span-2 items-center gap-4">
            <div className="flex items-center gap-4">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-full ${
                      isActive ? 'text-navy dark:text-white' : 'text-navy/70 dark:text-white/70 hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="publicNavPill"
                        className="absolute inset-0 rounded-full bg-navy/10 dark:bg-white/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <Switch theme={theme} toggleTheme={toggleTheme} />

            {!user ? (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hidden lg:block text-sm font-medium text-navy/70 dark:text-white/70 hover:text-navy dark:text-white transition-colors">Log In</Link>
                <Link to="/register" className="btn-accent text-xs sm:text-sm px-4 py-1.5 text-white">Get Started</Link>
              </div>
            ) : (
              <Link to="/dashboard" className="btn-accent text-xs sm:text-sm px-4 py-1.5 text-white">Go to Dashboard</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden justify-end items-center gap-2">
            <Switch theme={theme} toggleTheme={toggleTheme} />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-1.5 p-2 text-navy dark:text-white focus:outline-none rounded-xl hover:bg-navy/5 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-medium">{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="!absolute top-full left-0 right-0 mt-2 liquid-glass rounded-2xl p-3 flex flex-col gap-1 pointer-events-auto md:hidden shadow-lg border border-navy/5 dark:border-white/5"
            >
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-navy/10 dark:bg-white/10 text-navy dark:text-white' : 'text-navy/70 dark:text-white/70'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <hr className="border-navy/5 dark:border-white/5 my-1.5" />
              {!user ? (
                <div className="flex flex-col gap-1">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-navy/70 dark:text-white/70 text-center">Log In</Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-accent text-center px-4 py-2.5 text-white rounded-xl">Get Started</Link>
                </div>
              ) : (
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="btn-accent text-center px-4 py-2.5 text-white rounded-xl">Go to Dashboard</Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-transparent text-navy dark:text-white flex flex-col relative">
      <PublicNavbar />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
