import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Sun, Moon } from 'lucide-react';
import PlinthLogo from '../components/common/PlinthLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Switch from '../components/ui/sky-toggle';

export default function Sitemap() {
  const sitemapLinks = [
    {
      category: 'Public Pages',
      links: [
        { label: 'Home (Landing)', path: '/' },
        { label: 'About Us', path: '/about' },
        { label: 'Sitemap', path: '/sitemap' },
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
      ],
    },
    {
      category: 'Dashboard & Core Tools',
      links: [
        { label: 'Main Dashboard', path: '/dashboard' },
        { label: 'All Projects', path: '/projects' },
        { label: 'Notifications', path: '/notifications' },
        { label: 'Settings', path: '/settings' },
        { label: 'Team & Users', path: '/team' },
        { label: 'Billing', path: '/billing' },
        { label: 'Vendor Portal', path: '/vendor' },
        { label: 'Materials Portal', path: '/materials' },
        { label: 'Equipment Portal', path: '/equipment' },
        { label: 'Team Chat', path: '/chat' },
      ],
    },
    {
      category: 'Project Specific (Requires Project)',
      links: [
        { label: 'Project Overview', path: '/projects' },
        { label: 'Daily Logs', path: '/projects' },
        { label: 'Attendance', path: '/projects' },
        { label: 'Materials & Equipment', path: '/projects' },
        { label: 'Expenses & Budget', path: '/projects' },
        { label: 'Milestones', path: '/projects' },
        { label: 'Document Manager', path: '/projects' },
        { label: 'Issues & Tasks', path: '/projects' },
        { label: 'Gallery', path: '/projects' },
        { label: 'Owner Dashboard', path: '/projects' },
      ],
    }
  ];

  return (
    <>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-16 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-navy dark:text-white tracking-tight">Sitemap</h1>
          <p className="mt-4 text-lg text-navy/60 dark:text-white/60 max-w-2xl">A complete, bird's-eye view of all the pages, tools, and portals available across the PlinthHQ platform.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sitemapLinks.map((section, idx) => (
            <div key={idx} className="p-8 rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/80 dark:bg-violet-900/10 shadow-sm backdrop-blur-md animate-slideUp transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700/50" style={{ animationDelay: `${idx * 0.1}s` }}>
              <h2 className="text-lg font-bold text-navy mb-6 pb-4 border-b border-navy/10 dark:border-white/10">{section.category}</h2>
              <ul className="space-y-4">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link to={link.path} className="group flex items-center text-navy/70 dark:text-white/70 hover:text-navy dark:text-white transition-colors">
                      <ChevronRight className="h-4 w-4 mr-3 text-navy/20 dark:text-white/20 group-hover:text-orange transition-colors shrink-0" />
                      <span className="font-medium text-sm">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="liquid-glass rounded-none py-12 mt-auto" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row lg:px-8">
          <PlinthLogo size="xs" variant="full" />
          <div className="flex items-center gap-6">
            <Link to="/sitemap" className="text-sm text-navy/60 dark:text-white/60 hover:text-navy dark:text-white transition-colors">Sitemap</Link>
            <p className="text-sm text-navy/60 dark:text-white/60">&copy; {new Date().getFullYear()} PlinthHQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
