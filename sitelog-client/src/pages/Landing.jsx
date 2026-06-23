import { Link, useLocation } from 'react-router-dom';
import { useRef, useEffect, useCallback, useState } from 'react';
import {
  ArrowRight, CheckCircle, Camera, BarChart3, FileText,
  Shield, Smartphone, Users, Building2, ChevronRight, Sun, Moon
} from 'lucide-react';
import PlinthLogo from '../components/common/PlinthLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedHeroText from '../components/common/AnimatedHeroText';
import Switch from '../components/ui/sky-toggle';

/* ══════════════════════════════════════════════════════════
   FEATURES & DATA
   ══════════════════════════════════════════════════════════ */

const features = [
  { icon: Camera, title: 'Photo-Evidence Logs', desc: 'Attach up to 20 photos per daily entry with automatic compression and CDN delivery.' },
  { icon: BarChart3, title: 'Budget Control', desc: 'Real-time budget vs. actual tracking with alerts at 80% and 100% thresholds.' },
  { icon: FileText, title: 'PDF Reports', desc: 'Generate daily, weekly, and monthly reports with digital PM signatures.' },
  { icon: Shield, title: 'Owner Dashboard', desc: 'Secure shareable links for building owners with progress visibility and approvals.' },
  { icon: Smartphone, title: 'Mobile-First PWA', desc: 'Works offline on site. Capture photos directly from your phone camera.' },
  { icon: Users, title: 'Team Management', desc: 'Role-based access for engineers, PMs, owners, and accounts teams.' },
];

const stats = [
  { value: '30%', label: 'Reduction in overruns' },
  { value: '90%+', label: 'Daily log completion' },
  { value: '7 weeks', label: 'Full deployment' },
  { value: '35+', label: 'API endpoints' },
];

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <>


      {/* ── Hero with Particle Canvas ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20" style={{ minHeight: '60vh' }}>
          <div className="max-w-4xl w-full space-y-8">
            <div className="inline-block animate-slideUp">
              <span className="py-1 px-3 rounded-full text-xs font-mono text-muted tracking-widest uppercase"
                style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(120,140,200,0.08)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(120,140,200,0.15)', backdropFilter: 'blur(8px)' }}>
                <Building2 className="h-3 w-3 inline mr-1.5 -mt-0.5" /> Enterprise Construction Platform
              </span>
            </div>

            <AnimatedHeroText 
              staticText={"Your site's\nsingle source"} 
              rotatingPhrases={['of truth', 'of control', 'of visibility', 'of progress', 'of accountability', 'of confidence']} 
              isAboutPage={false} 
            />

            <div className="mt-8 flex flex-wrap justify-center gap-3 animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-3 py-1 text-sm">Real-time Sync</span>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-3 py-1 text-sm">Cloud Storage</span>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-3 py-1 text-sm">Offline Mode</span>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-3 py-1 text-sm">Owner Dashboards</span>
            </div>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-navy/70 dark:text-white/70 font-light leading-relaxed mt-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              Replace paper logs, WhatsApp updates, and spreadsheets with real-time site monitoring, budget control, and owner transparency.
            </p>

            <div className="pt-8 flex justify-center animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <Link to="/register" className="btn-accent px-12 py-3.5 text-base shadow-glow">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="liquid-glass rounded-none" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-4 lg:grid-cols-4 lg:px-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-mono text-3xl font-bold text-navy dark:text-white tracking-tight">{value}</p>
              <p className="mt-1.5 text-sm text-navy/70 dark:text-white/70 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {features.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title} className="card group animate-slideUp" style={{ animationDelay: `${0.1 * idx}s` }}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:shadow-lg"
                style={{ background: 'rgba(66, 133, 244, 0.08)' }}>
                <Icon className="h-6 w-6 text-orange" />
              </div>
              <h3 className="font-semibold text-navy dark:text-white text-lg tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/70 dark:text-white/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, rgba(10,12,16,0.3) 0%, rgba(17,24,39,0.3) 50%, rgba(10,12,16,0.3) 100%)' : 'linear-gradient(135deg, rgba(200,210,240,0.35) 0%, rgba(180,195,230,0.35) 50%, rgba(200,210,240,0.35) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: theme === 'dark' ? 'radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)' : 'radial-gradient(circle at 2px 2px, rgba(50,60,100,0.4) 0.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold lg:text-4xl tracking-tight text-navy dark:text-white">Ready to digitise your construction site?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy/70 dark:text-white/70 leading-relaxed">
            Join forward-thinking contractors who reduced project overruns by 30% with PlinthHQ&apos;s real-time accountability and owner visibility.
          </p>
          <Link to="/register" className="btn-accent mt-10 inline-flex px-10 py-4 text-base shadow-glow">
            Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="liquid-glass rounded-none py-12" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row lg:px-8">
          <PlinthLogo size="xs" variant="full" />
          <div className="flex items-center gap-6">
            <Link to="/sitemap" className="text-sm text-navy/60 dark:text-white/60 hover:text-navy dark:text-white transition-colors">Sitemap</Link>
            <p className="text-sm text-navy/60 dark:text-white/60">&copy; {new Date().getFullYear()} PlinthHQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
