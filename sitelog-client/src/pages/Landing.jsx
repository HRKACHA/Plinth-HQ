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
  { icon: Shield, title: 'Owner Dashboard', desc: 'Secure shareable links for building owners with progress visibility and approvals.' },
  { icon: Users, title: 'Team Management', desc: 'Role-based access for engineers, PMs, owners, and accounts teams.' },
  { icon: Smartphone, title: 'Mobile-First PWA', desc: 'Works offline on site. Capture photos directly from your phone camera.' },
  { icon: BarChart3, title: 'Budget Control', desc: 'Real-time budget vs. actual tracking with alerts at 80% and 100% thresholds.' },
  { icon: Camera, title: 'Photo-Evidence Logs', desc: 'Attach up to 20 photos per daily entry with automatic compression and CDN delivery.' },
  { icon: FileText, title: 'PDF Reports', desc: 'Generate daily, weekly, and monthly reports with digital PM signatures.' },
];

const stats = [
  { value: '90%+', label: 'Daily log completion' },
  { value: '7 weeks', label: 'Full deployment' },
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
      <section className="relative overflow-hidden flex items-center min-h-screen -mt-24 lg:-mt-[104px]">
        
        {/* Dotted Background on the Left (Text Side) fading out towards right completely */}
        <div 
          className="absolute inset-0 opacity-[0.04] z-0" 
          style={{
            backgroundImage: theme === 'dark' ? 'radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)' : 'radial-gradient(circle at 2px 2px, rgba(50,60,100,0.5) 0.5px, transparent 0)',
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(to right, black 20%, transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 50%)',
          }} 
        />

        {/* Seamless Dual-Tone Background & Particle Blocker */}
        {/* Light Mode Gradient */}
        <div 
          className="absolute inset-0 z-0 transition-opacity duration-500 opacity-100 dark:opacity-0"
          style={{
            background: 'linear-gradient(to right, transparent 0%, transparent 40%, rgb(220, 232, 255) 80%, rgb(220, 232, 255) 100%)',
          }}
        />
        {/* Dark Mode Gradient */}
        <div 
          className="absolute inset-0 z-0 transition-opacity duration-500 opacity-0 dark:opacity-100"
          style={{
            background: 'linear-gradient(to right, transparent 0%, transparent 40%, #0A0C10 80%, #0A0C10 100%)',
          }}
        />

        {/* Right Image Background (Full Bleed) */}
        <div className="absolute right-0 top-[35%] lg:top-0 w-full lg:w-[60%] h-[65%] lg:h-full z-0 pointer-events-none">
          {/* Light Mode Image */}
          <div className="absolute inset-0 w-full h-full transition-opacity duration-500 opacity-100 dark:opacity-0"
               style={{
                 maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                 WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                 maskComposite: 'intersect',
                 WebkitMaskComposite: 'destination-in',
               }}>
            <img 
              src="/Landing_image_white.png" 
              alt="PlinthHQ Dashboard Light" 
              className="absolute inset-0 w-full h-full object-cover" 
              style={{ objectPosition: 'center center' }}
              loading="eager"
              fetchpriority="high"
              decoding="sync"
            />
          </div>

          {/* Dark Mode Image */}
          <div className="absolute inset-0 w-full h-full transition-opacity duration-500 opacity-0 dark:opacity-100"
               style={{
                 maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                 WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                 maskComposite: 'intersect',
                 WebkitMaskComposite: 'destination-in',
               }}>
            <img 
              src="/Landing_image.png" 
              alt="PlinthHQ Dashboard Dark" 
              className="absolute inset-0 w-full h-full object-cover" 
              style={{ objectPosition: 'center center' }}
              loading="eager"
              fetchpriority="high"
              decoding="sync"
            />
          </div>
        </div>

        {/* Mobile text background overlay — keeps text area clean */}
        <div className="absolute inset-x-0 top-0 h-[45%] z-[1] lg:hidden transition-colors duration-500"
             style={{
               background: theme === 'dark'
                 ? 'linear-gradient(to bottom, rgb(10, 12, 16) 80%, transparent 100%)'
                 : 'linear-gradient(to bottom, rgb(220, 232, 255) 80%, transparent 100%)',
             }} />

        {/* Content Container */}
        <div className="relative z-10 w-full px-4 lg:px-[60px] xl:px-[100px] grid grid-cols-1 lg:grid-cols-2 items-center h-full pt-8 pb-20 lg:pt-48 lg:pb-16">
          
          {/* Left Text Side */}
          <div className="lg:pr-8 flex flex-col items-start gap-6 text-left">
            <div className="inline-block animate-slideUp">
              <span className="py-1 px-3 rounded-full text-[10px] sm:text-xs font-mono text-muted tracking-widest uppercase"
                style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(120,140,200,0.08)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(120,140,200,0.15)', backdropFilter: 'blur(8px)' }}>
                <Building2 className="h-3 w-3 inline mr-1.5 -mt-0.5" /> Enterprise Construction Platform
              </span>
            </div>

            <AnimatedHeroText 
              staticText={"Your site's\nsingle source"} 
              rotatingPhrases={['of truth', 'of control', 'of visibility', 'of progress', 'of accountability', 'of confidence']} 
              isAboutPage={false} 
              className="text-[2.75rem] md:text-7xl lg:text-8xl"
            />

            <div className="flex flex-wrap gap-2 sm:gap-3 animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-2.5 py-1 text-xs sm:text-sm">Real-time Sync</span>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-2.5 py-1 text-xs sm:text-sm">Cloud Storage</span>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-2.5 py-1 text-xs sm:text-sm">Offline Mode</span>
              <span className="badge bg-navy/5 dark:bg-white/5 text-navy/80 dark:text-white/80 border-navy/10 dark:border-white/10 px-2.5 py-1 text-xs sm:text-sm">Owner Dashboards</span>
            </div>

            <p className="text-base md:text-lg text-navy/90 dark:text-white/70 font-light leading-relaxed animate-slideUp" style={{ animationDelay: '0.2s', maxWidth: '500px' }}>
              Replace paper logs, WhatsApp updates, and spreadsheets with real-time site monitoring, budget control, and owner transparency.
            </p>

            <div className="animate-slideUp flex gap-4" style={{ animationDelay: '0.3s' }}>
              <Link to="/register" className="btn-accent px-6 py-2.5 text-sm shadow-glow">
                Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          </div>
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
              <p className="mt-2 text-sm leading-relaxed text-navy/90 dark:text-white/70">{desc}</p>
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
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy/90 dark:text-white/70 leading-relaxed">
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
            <Link to="/sitemap" className="text-sm text-navy/80 dark:text-white/60 hover:text-navy dark:text-white transition-colors">Sitemap</Link>
            <p className="text-sm text-navy/80 dark:text-white/60">&copy; {new Date().getFullYear()} PlinthHQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
