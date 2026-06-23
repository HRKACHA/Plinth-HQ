import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, HardHat, BarChart3, ShieldCheck, Zap, Camera, FileText,
  Users, Smartphone, Building2, CheckCircle, MessageSquare, Package,
  Wrench, ClipboardList, TrendingUp, Lock, Globe, Layers, ChevronRight,
  Shield, Folder, Clock, Eye, Bell, BookOpen, Target, Award, Mic, Sun, Moon, Bot, Map
} from 'lucide-react';
import ParticleBackground from '../components/common/ParticleBackground';
import PlinthLogo from '../components/common/PlinthLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedHeroText from '../components/common/AnimatedHeroText';
import Switch from '../components/ui/sky-toggle';

/* ══════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ══════════════════════════════════════════════════════════ */
function useCountUp(target, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, startOnView]);

  return { count, ref };
}

/* ══════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════ */

const PROBLEMS = [
  { icon: ClipboardList, problem: 'Paper-based daily logs', solution: 'Digital daily logs with photo evidence, weather tracking, and automatic timestamps' },
  { icon: BarChart3, problem: 'No budget visibility until it\'s too late', solution: 'Real-time budget vs. actual tracking with alerts at 80% and 100% thresholds' },
  { icon: MessageSquare, problem: 'Scattered WhatsApp groups per site', solution: 'Project-wise encrypted team chat with role-based access control' },
  { icon: ShieldCheck, problem: 'Defects and snags forgotten', solution: 'Punch-list and issue tracking assigned directly to contractors with photo proof' },
  { icon: Users, problem: 'No clarity on who does what', solution: 'Role-based team management with project-specific assignments' },
  { icon: Package, problem: 'Materials going untracked', solution: 'Full material inventory with stock movements, low-stock alerts, and cost tracking' },
  { icon: Wrench, problem: 'Equipment maintenance missed', solution: 'Equipment tracking with service history, maintenance-due alerts, and assignment logs' },
];

const FEATURES = [
  {
    category: 'Daily Operations',
    color: '#4285F4',
    items: [
      { icon: Camera, title: 'Photo-Evidence Logs', desc: 'Attach up to 20 photos per daily entry with automatic compression. Record weather, workforce count, and detailed observations.' },
      { icon: ShieldCheck, title: 'Issue & Snag Tracking', desc: 'Create punch-list items, set priority levels, and assign them directly to contractors with Kanban-style status tracking.' },
      { icon: FileText, title: 'Automated PDF Reports', desc: 'Instantly export professional PDF summaries of project budget, burn rate, and complete expense history.' },
    ]
  },
  {
    category: 'Financial Control',
    color: '#34A853',
    items: [
      { icon: BarChart3, title: 'Budget Dashboard', desc: 'Visual breakdown of budget allocation vs. actual spend with category-wise tracking and trend analysis.' },
      { icon: TrendingUp, title: 'Expense Management', desc: 'Log expenses with receipts, categorize by type, and get instant visibility into where every rupee is going.' },
      { icon: Target, title: 'Milestone Tracking', desc: 'Define project milestones with deadlines, track completion percentage, and get PM/Owner approval workflows.' },
    ]
  },
  {
    category: 'Resource Management',
    color: '#F59E0B',
    items: [
      { icon: Package, title: 'Material Inventory', desc: 'Track material stock with movements (in/out), supplier linkage, unit costs, and automatic low-stock notifications.' },
      { icon: Wrench, title: 'Equipment Portal', desc: 'Manage heavy equipment with assignment tracking, service history, maintenance schedules, and utilization rates.' },
      { icon: Globe, title: 'Vendor Management', desc: 'Maintain vendor directory with contact details, spending history, and performance records in one place.' },
    ]
  },
  {
    category: 'Collaboration',
    color: '#A855F7',
    items: [
      { icon: MessageSquare, title: 'Project-Wise Chat', desc: 'Real-time encrypted messaging scoped to each project. Only team members assigned to a project can access its chat.' },
      { icon: Camera, title: 'Project Photo Gallery', desc: 'A centralized masonry grid that automatically aggregates all photos uploaded across Daily Logs and Issues.' },
      { icon: Users, title: 'Team Management', desc: 'Invite members via email, assign roles (Engineer, Contractor, Accounts, Owner, PM), and manage rosters.' },
    ]
  },
  {
    category: 'AI & Accessibility',
    color: '#EC4899',
    items: [
      { icon: Mic, title: 'Voice Dictation', desc: 'Keep your gloves on. Log site updates, create issues, and chat using voice dictation directly from the job site.' },
      { icon: Globe, title: 'Multi-Language Translation', desc: 'Communicate seamlessly across regional languages with real-time translation for English, Hindi, and Gujarati.' },
      { icon: Bot, title: 'PlinthAI Assistant', desc: 'A floating, context-aware AI assistant available everywhere to answer project queries and help you navigate the platform instantly.' },
    ]
  },
];

const ROLES = [
  {
    role: 'Project Manager',
    icon: Shield,
    color: '#10B981',
    access: ['Full access to all modules', 'Create & manage projects', 'Invite & manage team members', 'Approve expenses & milestones', 'Generate & share reports', 'Access all project chats'],
  },
  {
    role: 'Site Engineer',
    icon: HardHat,
    color: '#3B82F6',
    access: ['Submit daily site logs with photos', 'Mark attendance', 'View project details & milestones', 'Participate in project chat', 'View materials & equipment'],
  },
  {
    role: 'Accounts',
    icon: BarChart3,
    color: '#F59E0B',
    access: ['Full access to budget & expenses', 'View billing & financial reports', 'Manage vendor payments', 'Track material costs', 'View equipment costs'],
  },
  {
    role: 'Owner',
    icon: Eye,
    color: '#A855F7',
    access: ['Full access like Project Manager', 'View owner dashboard via share link', 'Approve milestones', 'Monitor budget health', 'Access all project data'],
  },
  {
    role: 'Contractor',
    icon: Wrench,
    color: '#F97316',
    access: ['Submit daily site logs with photos', 'Manage assigned issues and snags', 'View project attendance and materials', 'Restricted from financial data'],
  },
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Create Your Project', desc: 'Set up your construction project with budget, timeline, location, and team structure.', icon: Building2 },
  { step: '02', title: 'Build Your Team', desc: 'Invite engineers, accountants, and owners. Each member is assigned to specific projects.', icon: Users },
  { step: '03', title: 'Track Daily Progress', desc: 'Engineers submit daily logs with photos, weather data, attendance, and material usage.', icon: ClipboardList },
  { step: '04', title: 'Monitor & Control', desc: 'PMs and owners get real-time dashboards showing budget, milestones, and site activity.', icon: TrendingUp },
  { step: '05', title: 'Collaborate in Real-Time', desc: 'Project-wise chat keeps communication focused. No more lost WhatsApp messages.', icon: MessageSquare },
  { step: '06', title: 'Report & Deliver', desc: 'Generate professional PDF reports, track milestone completion, and close projects with full documentation.', icon: Award },
];

const STATS = [
  { value: 90, suffix: '%+', label: 'Daily log completion rate' },
  { value: 5, suffix: '', label: 'User roles supported' },
];

/* ══════════════════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════════════════ */

function StatCounter({ value, suffix, label }) {
  const { count, ref } = useCountUp(value, 1800);
  return (
    <div ref={ref} className="text-center">
      <p className="font-mono text-4xl md:text-5xl font-bold text-navy dark:text-white tracking-tight">
        {count}{suffix}
      </p>
      <p className="mt-2 text-sm text-navy/70 dark:text-white/70 font-medium">{label}</p>
    </div>
  );
}

function SectionBadge({ children }) {
  const { theme } = useTheme();
  return (
    <span className="inline-block py-1.5 px-4 rounded-full text-xs font-mono text-muted tracking-widest uppercase mb-6"
      style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(120,140,200,0.08)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(120,140,200,0.15)', backdropFilter: 'blur(8px)' }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   ABOUT PAGE
   ══════════════════════════════════════════════════════════ */

export default function About() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeFeatureCategory, setActiveFeatureCategory] = useState(0);
  return (
    <>



      {/* ══════════════════════════════════════════════════
         SECTION 1: Hero
         ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20" style={{ minHeight: '60vh' }}>
          <div className="max-w-4xl w-full">
            <div className="inline-block animate-slideUp mb-6">
              <SectionBadge>About PlinthHQ</SectionBadge>
            </div>
            <div className="mb-8">
              <AnimatedHeroText
                staticText={"The command center"}
                rotatingPhrases={[
                  'your construction site\ndeserves.',
                  'your projects\ndeserve.',
                  'your teams\ndeserve.',
                  'your budgets\ndeserve.',
                  'your owners\ndeserve.',
                  'your progress\ndeserves.'
                ]}
                isAboutPage={true}
              />
            </div>
            <p className="text-xl text-navy/70 dark:text-white/70 leading-relaxed max-w-3xl mx-auto mt-6">
              PlinthHQ is a comprehensive construction management platform that replaces paper logs, scattered spreadsheets, and fragmented WhatsApp groups with a unified, real-time digital command center. Built for the realities of the Indian construction industry.
            </p>
            <div className="pt-10 flex justify-center">
              <Link to="/register" className="btn-accent px-12 py-3.5 text-base shadow-glow">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 2: Stats Bar
         ══════════════════════════════════════════════════ */}
      <section className="liquid-glass rounded-none" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-8 lg:px-8">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 3: The Problem We Solve
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <SectionBadge>The Problem</SectionBadge>
          <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight">
            Construction sites run on chaos.<br />We bring clarity.
          </h2>
          <p className="mt-5 text-lg text-navy/70 dark:text-white/70 leading-relaxed">
            Every day, project managers lose hours to disconnected tools, missing data, and communication gaps. Here's how PlinthHQ transforms each pain point into a superpower.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROBLEMS.map(({ icon: Icon, problem, solution }, idx) => (
            <div key={idx} className="card group animate-slideUp" style={{ animationDelay: `${0.08 * idx}s` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <Icon className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400/70 uppercase tracking-wider">Problem</p>
                  <p className="text-sm font-semibold text-navy/80 dark:text-white/80">{problem}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(120,140,200,0.10)' }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(52, 168, 83, 0.08)', border: '1px solid rgba(52, 168, 83, 0.15)' }}>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider">PlinthHQ Solution</p>
                  <p className="text-sm text-navy/70 dark:text-white/70 leading-relaxed">{solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 4: Features (Tabbed)
         ══════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-12 px-4 mx-auto max-w-7xl scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <SectionBadge>Platform Features</SectionBadge>
          <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight">
            Everything you need,<br />nothing you don't.
          </h2>
          <p className="mt-5 text-lg text-navy/70 dark:text-white/70 leading-relaxed">
            Five powerful modules covering every aspect of construction project management — from field operations to financial oversight.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FEATURES.map((cat, idx) => (
            <button
              key={cat.category}
              onClick={() => setActiveFeatureCategory(idx)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeFeatureCategory === idx
                ? 'text-navy dark:text-white shadow-lg'
                : 'text-navy/70 dark:text-white/70 hover:text-navy/80 dark:text-white/80'
                }`}
              style={activeFeatureCategory === idx
                ? { background: `${cat.color}20`, border: `1px solid ${cat.color}40`, boxShadow: `0 0 20px ${cat.color}15` }
                : { background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(120,140,200,0.06)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(120,140,200,0.10)' }
              }
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6" key={activeFeatureCategory}>
          {FEATURES[activeFeatureCategory].items.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title} className="card group animate-slideUp" style={{ animationDelay: `${0.1 * idx}s` }}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:shadow-lg"
                style={{ background: `${FEATURES[activeFeatureCategory].color}12`, border: `1px solid ${FEATURES[activeFeatureCategory].color}20` }}>
                <Icon className="h-6 w-6" style={{ color: FEATURES[activeFeatureCategory].color }} />
              </div>
              <h3 className="font-semibold text-navy dark:text-white text-lg tracking-tight mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-navy/70 dark:text-white/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 5: How It Works (Workflow)
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, rgba(10,12,16,0.3) 0%, rgba(17,24,39,0.3) 50%, rgba(10,12,16,0.3) 100%)' : 'linear-gradient(135deg, rgba(200,210,240,0.35) 0%, rgba(180,195,230,0.35) 50%, rgba(200,210,240,0.35) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: theme === 'dark' ? 'radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)' : 'radial-gradient(circle at 2px 2px, rgba(50,60,100,0.4) 0.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <SectionBadge>How It Works</SectionBadge>
            <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight">
              From setup to site delivery,<br />in six simple steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map(({ step, title, desc, icon: Icon }, idx) => (
              <div key={step} className="relative card group animate-slideUp" style={{ animationDelay: `${0.1 * idx}s` }}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <span className="font-mono text-3xl font-bold tracking-tight"
                      style={{ background: 'linear-gradient(180deg, rgba(66,133,244,0.6) 0%, rgba(66,133,244,0.15) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {step}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-orange" />
                      <h3 className="font-semibold text-navy dark:text-white tracking-tight">{title}</h3>
                    </div>
                    <p className="text-sm text-navy/70 dark:text-white/70 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 6: Role-Based Access
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <SectionBadge>Role-Based Access</SectionBadge>
          <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight">
            Right access for the<br />right people.
          </h2>
          <p className="mt-5 text-lg text-navy/70 dark:text-white/70 leading-relaxed">
            Every team member sees exactly what they need — no more, no less. Our granular permission system ensures data security while maximizing productivity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLES.map(({ role, icon: Icon, color, access }, idx) => (
            <div key={role} className="card group animate-slideUp" style={{ animationDelay: `${0.1 * idx}s` }}>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white tracking-tight mb-4">{role}</h3>
              <ul className="space-y-2.5">
                {access.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                    <span className="text-xs text-navy/70 dark:text-white/70 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 7: Core Values
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <SectionBadge>Why PlinthHQ</SectionBadge>
          <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight">
            Built different.<br />Built for construction.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="liquid-glass p-10 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-2xl bg-orange/10 flex items-center justify-center mb-6" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
              <HardHat className="h-6 w-6 text-orange" />
            </div>
            <h3 className="text-2xl font-bold text-navy dark:text-white mb-4 tracking-tight">Built for the Field</h3>
            <p className="text-navy/70 dark:text-white/70 leading-relaxed">
              Software shouldn't be confined to an office. We designed PlinthHQ with the reality of the Indian jobsite in mind — fast, resilient, and intuitive. Whether you're tracking daily logs under the sun or logging heavy equipment usage on a muddy site, our platform stays out of your way so you can focus on building.
            </p>
          </div>

          <div className="liquid-glass p-10 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <BarChart3 className="h-6 w-6" style={{ color: '#4285F4' }} />
            </div>
            <h3 className="text-2xl font-bold text-navy dark:text-white mb-4 tracking-tight">Unprecedented Visibility</h3>
            <p className="text-navy/70 dark:text-white/70 leading-relaxed">
              Construction is a game of margins and timelines. PlinthHQ bridges the gap between the field crew and project owners by delivering real-time insights into budgets, milestones, and daily operations. No more guessing — just hard data and absolute accountability.
            </p>
          </div>

          <div className="liquid-glass p-10 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(52, 168, 83, 0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ShieldCheck className="h-6 w-6" style={{ color: '#34A853' }} />
            </div>
            <h3 className="text-2xl font-bold text-navy dark:text-white mb-4 tracking-tight">Ironclad Reliability</h3>
            <p className="text-navy/70 dark:text-white/70 leading-relaxed">
              Your data is the lifeblood of your project. We employ enterprise-grade security and robust cloud infrastructure to ensure that your site logs, financial documents, and vendor details are protected and accessible the moment you need them — backed by MongoDB Atlas.
            </p>
          </div>

          <div className="liquid-glass p-10 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Zap className="h-6 w-6" style={{ color: '#A855F7' }} />
            </div>
            <h3 className="text-2xl font-bold text-navy dark:text-white mb-4 tracking-tight">Frictionless Workflows</h3>
            <p className="text-navy/70 dark:text-white/70 leading-relaxed">
              Stop fighting with disconnected spreadsheets and fragmented chat threads. PlinthHQ centralizes materials, equipment, team roles, and site communications into one unified command center, driving efficiency across your entire organization from foundation to finish.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 8: Owner Dashboard Highlight
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4 mx-auto max-w-7xl">
        <div className="liquid-glass rounded-3xl p-10 md:p-14 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1">
            <SectionBadge>Owner Transparency</SectionBadge>
            <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight mb-6">
              Give building owners<br />complete visibility.
            </h2>
            <p className="text-navy/70 dark:text-white/70 leading-relaxed mb-8">
              Generate a secure, shareable link that gives building owners a read-only dashboard. They can see project progress, budget health, milestone status, and daily activity — without needing a PlinthHQ account or any technical knowledge.
            </p>
            <ul className="space-y-3">
              {[
                'Secure share link with token-based access',
                'Real-time progress percentage and budget overview',
                'Milestone approval workflow for owners',
                'Photo evidence from daily site logs',
                'No login or app installation required',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-navy/80 dark:text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[340px] rounded-2xl p-6" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(120,140,200,0.06)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(120,140,200,0.10)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">Owner Dashboard</p>
                  <p className="text-[10px] text-muted">Shared via secure link</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Progress</span>
                  <span className="text-xs font-bold text-emerald-400">67%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(120,140,200,0.08)' }}>
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: '67%' }} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(120,140,200,0.05)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(120,140,200,0.08)' }}>
                    <p className="text-[10px] text-muted">Budget Used</p>
                    <p className="text-sm font-bold text-navy">₹12.4L</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(120,140,200,0.05)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(120,140,200,0.08)' }}>
                    <p className="text-[10px] text-muted">Milestones</p>
                    <p className="text-sm font-bold text-navy">4 / 6</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(120,140,200,0.05)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(120,140,200,0.08)' }}>
                  <p className="text-[10px] text-muted mb-1">Latest Log</p>
                  <p className="text-xs text-muted">Foundation work completed. RCC column casting started for Block A.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 9: Tech Stack
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(66,133,244,0.03) 0%, transparent 70%)' }} />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <SectionBadge>Technology</SectionBadge>
            <h2 className="font-display text-3xl font-bold text-navy dark:text-white lg:text-4xl tracking-tight">
              Modern stack,<br />enterprise reliability.
            </h2>
            <p className="mt-5 text-lg text-navy/70 dark:text-white/70 leading-relaxed">
              PlinthHQ is built with a modern, scalable technology stack designed for performance and reliability at every layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Frontend', tech: 'React + Vite', desc: 'Lightning-fast SPA with real-time HMR and optimized production builds.', icon: Layers, color: '#61DAFB' },
              { label: 'Backend', tech: 'Node.js + Express', desc: 'RESTful API with 35+ endpoints, JWT auth, role middleware, and Socket.IO.', icon: Globe, color: '#68A063' },
              { label: 'Database', tech: 'MongoDB Atlas', desc: 'Cloud-hosted NoSQL database with indexed queries and atomic operations.', icon: BookOpen, color: '#47A248' },
              { label: 'Real-Time', tech: 'Socket.IO', desc: 'WebSocket-based real-time chat, typing indicators, and live notifications.', icon: Zap, color: '#010101' },
            ].map(({ label, tech, desc, icon: Icon, color }, idx) => (
              <div key={label} className="card-static p-6 animate-slideUp" style={{ animationDelay: `${0.1 * idx}s` }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-navy dark:text-white font-bold tracking-tight mb-2">{tech}</h3>
                <p className="text-xs text-navy/70 dark:text-white/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
         SECTION 10: CTA
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 mt-4 overflow-hidden border-t" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(120,140,200,0.10)' }}>
        <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'radial-gradient(ellipse at center, rgba(66,133,244,0.04) 0%, transparent 70%)' : 'radial-gradient(ellipse at center, rgba(100,130,230,0.06) 0%, transparent 70%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold lg:text-5xl tracking-tight text-navy dark:text-white">
            Ready to transform your<br />construction workflow?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy/70 dark:text-white/70 leading-relaxed">
            Join forward-thinking contractors who reduced project overruns by 30% with PlinthHQ's real-time accountability and owner visibility. Start your free trial today.
          </p>
          <div className="pt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-accent px-10 py-4 text-base shadow-glow">
              Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-4 text-base text-navy/80 dark:text-white/80">
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 liquid-glass rounded-none py-12" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
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
