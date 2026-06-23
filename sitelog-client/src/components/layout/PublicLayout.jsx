import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  return (
    <div className="sticky top-4 z-50 mx-auto max-w-7xl px-4 lg:px-8 pt-4 pointer-events-none">
      <div className="liquid-glass flex items-center justify-between rounded-2xl px-6 py-3 pointer-events-auto">
        <div className="flex justify-start">
          <Link to="/"><PlinthLogo size="xxs" /></Link>
        </div>
        
        <div className="flex justify-end items-center gap-4">
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors rounded-full ${
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
              <Link to="/login" className="hidden sm:block text-sm font-medium text-navy/70 dark:text-white/70 hover:text-navy dark:text-white transition-colors">Log In</Link>
              <Link to="/register" className="btn-accent text-xs sm:text-sm px-4 py-1.5 text-white">Get Started</Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn-accent text-xs sm:text-sm px-4 py-1.5 text-white">Go to Dashboard</Link>
          )}
        </div>
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
