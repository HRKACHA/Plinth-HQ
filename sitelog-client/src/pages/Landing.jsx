import { Link } from 'react-router-dom';
import { useRef, useEffect, useCallback, useState } from 'react';
import {
  ArrowRight, CheckCircle, Camera, BarChart3, FileText,
  Shield, Smartphone, Users, Building2, ChevronRight,
} from 'lucide-react';
import PlinthLogo from '../components/common/PlinthLogo';
import { useAuth } from '../context/AuthContext';
import AnimatedHeroText from '../components/common/AnimatedHeroText';

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

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* ── Nav ── */}
      <nav className="sticky top-4 z-50 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="liquid-glass grid grid-cols-3 items-center rounded-2xl px-6 py-3">
          <div className="flex justify-start">
            <Link to="/"><PlinthLogo size="xxs" /></Link>
          </div>
          <div className="flex justify-center items-center gap-6 hidden sm:flex">
            <Link to="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">About</Link>
            {!user && (
              <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign In</Link>
            )}
          </div>
          <div className="flex justify-end items-center gap-4">
            {user && (
              <Link to="/dashboard" className="btn-accent text-sm px-4 py-1.5">Go to Dashboard</Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero with Particle Canvas ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 80px)' }}>        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="max-w-4xl w-full space-y-8">
            <div className="inline-block animate-slideUp">
              <span className="py-1 px-3 rounded-full text-xs font-mono text-white/60 tracking-widest uppercase"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <Building2 className="h-3 w-3 inline mr-1.5 -mt-0.5" /> Enterprise Construction Platform
              </span>
            </div>

            <AnimatedHeroText 
              staticText={"Your site's\nsingle source"} 
              rotatingPhrases={['of truth', 'of control', 'of visibility', 'of progress', 'of accountability', 'of confidence']} 
              isAboutPage={false} 
            />

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 font-light leading-relaxed mt-6">
              Replace paper logs, WhatsApp updates, and spreadsheets with real-time site monitoring, budget control, and owner transparency.
            </p>

            <div className="pt-8 flex justify-center">
              <Link to="/register" className="btn-accent px-12 py-3.5 text-base shadow-glow">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="liquid-glass rounded-none" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 lg:grid-cols-4 lg:px-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-mono text-3xl font-bold text-white tracking-tight">{value}</p>
              <p className="mt-1.5 text-sm text-white/40 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl tracking-tight">Built for the field, trusted by owners</h2>
          <p className="mt-5 text-lg text-white/40 leading-relaxed">
            Every module designed around real construction workflows — from daily diary entries to milestone sign-offs.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title} className="card group animate-slideUp" style={{ animationDelay: `${0.1 * idx}s` }}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:shadow-lg"
                style={{ background: 'rgba(66, 133, 244, 0.08)' }}>
                <Icon className="h-6 w-6 text-orange" />
              </div>
              <h3 className="font-semibold text-white text-lg tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,12,16,0.3) 0%, rgba(17,24,39,0.3) 50%, rgba(10,12,16,0.3) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold lg:text-4xl tracking-tight text-white">Ready to digitise your construction site?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/40 leading-relaxed">
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
          <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} PlinthHQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
