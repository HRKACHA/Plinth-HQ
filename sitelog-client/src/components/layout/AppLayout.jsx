import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Bell, Settings, Users, CreditCard,
  Truck, LogOut, Menu, X, Search, User, Sun, Moon, ChevronDown, MessageCircle,
  Package, Wrench, Shield, UserCog, PanelLeftClose, PanelLeftOpen, Globe, Info, Receipt, FileText, Map
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAsync } from '../../hooks/useAsync';
import { notificationApi, projectApi, searchApi } from '../../api/index';
import PlinthLogo from '../common/PlinthLogo';
import PlinthAIChatbot from '../common/PlinthAIChatbot';
import Switch from '../ui/sky-toggle';

/* ── Navigation Structure ── */
const directNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
];

const operationsItems = [
  { path: '/team', label: 'Team', desc: 'Crew, Roles & Certifications', icon: Users },
  { path: '/chat', label: 'Chat', desc: 'Real-time team communication', icon: MessageCircle },
  { path: '/vendor', label: 'Vendors', desc: 'Suppliers & Procurement', icon: Truck },
  { path: '/materials', label: 'Materials', desc: 'Inventory & Stock Management', icon: Package },
  { path: '/equipment', label: 'Equipment', desc: 'Assets, Rentals & Maintenance', icon: Wrench },
];

const accountItems = [
  { path: '/billing', label: 'Billing', desc: 'Plan, Payments & Invoices', icon: CreditCard },
  { path: '/settings', label: 'Settings', desc: 'Profile & Preferences', icon: Settings },
  { path: '/sitemap', label: 'Sitemap', desc: 'Overview of all pages', icon: Map },
];

export default function AppLayout({ children, title, backTo, noPadding = false }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const profileRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchApi.global(searchQuery);
        setSearchResults(res);
      } catch (err) {
        console.error(err);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: notifications } = useAsync(() => notificationApi.list(), []);
  const { data: projects } = useAsync(() => projectApi.list(), []);
  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

  // Role-Based Access Control Helper
  const canViewNav = (path) => {
    const role = user?.role;
    if (['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(role)) return true;
    if (['site_engineer', 'Engineer', 'Labour'].includes(role)) {
      if (path === '/vendor') return false; // Site Engineers shouldn't manage Vendors
      return true;
    }
    return true; // Accounts can now see everything globally (materials, equipment, billing)
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const toggleDropdown = useCallback((name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  const handleMouseEnter = useCallback((name) => {
    setOpenDropdown(name);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  const handleDropdownItemClick = (path) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    if (path.startsWith('#')) return;
    navigate(path);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const allSearchItems = [
    ...directNavItems,
    ...operationsItems.filter(i => !i.comingSoon),
    ...accountItems,
  ];

  // Theme-aware inline style helpers
  const isDark = theme === 'dark';
  const sidebarBg = isDark ? 'rgba(16, 18, 24, 0.40)' : 'rgba(255, 255, 255, 0.55)';
  const headerBg = isDark ? 'rgba(16, 18, 24, 0.30)' : 'rgba(255, 255, 255, 0.50)';
  const mobileBg = isDark ? 'rgba(16, 18, 24, 0.92)' : 'rgba(245, 248, 255, 0.96)';
  const subtleBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,40,0.06)';
  const searchBg = isDark ? 'rgba(16,18,24,0.90)' : 'rgba(245,248,255,0.96)';
  const searchBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,40,0.08)';
  const dropdownBg = isDark ? 'rgba(16,18,24,0.88)' : 'rgba(245,248,255,0.96)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,40,0.03)';
  const iconTextClass = isDark ? 'text-navy/70 dark:text-white/70 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:text-white' : 'text-navy-light hover:bg-black/5 hover:text-navy';

  return (
    <div className="flex h-screen bg-transparent overflow-hidden relative z-10">
      <div className="absolute inset-0 backdrop-blur-sm bg-surface/50 pointer-events-none -z-10" />
      {/* ═══ Vertical Sidebar — Liquid Glass ═══ */}
      <aside className={`hidden lg:flex flex-col ${isCollapsed ? 'w-[72px]' : 'w-52'} shrink-0 z-50 transition-all duration-300`}
        style={{ background: sidebarBg, backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderRight: subtleBorder, transition: 'background 0.3s ease' }}>
        <div className={`py-4 flex items-center justify-center shrink-0 transition-all`} style={{ borderBottom: subtleBorder }}>
          <Link to="/dashboard" title={isCollapsed ? "PlinthHQ" : ""}>
            <PlinthLogo size="xs" iconOnly={isCollapsed} />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-3'} space-y-6 flex flex-col transition-all`}>
          {/* Main Group */}
          <div className="space-y-1">
            {directNavItems.filter(item => canViewNav(item.path)).map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                title={isCollapsed ? label : ""}
                className={`flex items-center ${isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all ${isActive(path) ? 'bg-orange/10 text-orange' : 'text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            ))}
          </div>

          {/* Operations Group */}
          <div className="space-y-1">
            {!isCollapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-navy/20 dark:text-white/20">Operations</p>}
            {isCollapsed && <div className="h-px w-8 mx-auto my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            {operationsItems.filter(item => canViewNav(item.path)).map(({ path, label, icon: Icon, comingSoon }) => (
              <button
                key={path}
                type="button"
                title={isCollapsed ? label + (comingSoon ? ' (Soon)' : '') : ""}
                onClick={() => { if (!comingSoon) navigate(path); }}
                disabled={comingSoon}
                className={`flex items-center ${isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full text-left'} rounded-xl text-sm font-medium transition-all ${comingSoon ? 'opacity-40 cursor-not-allowed' : isActive(path) ? 'bg-orange/10 text-orange' : 'text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{label}</span>
                    {comingSoon && <span className="text-[9px] text-navy/60 dark:text-white/60 bg-navy/5 dark:bg-white/5 px-1 py-0.5 rounded shrink-0 ml-1">Soon</span>}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Account Group */}
          <div className="space-y-1 pt-4" style={{ borderTop: subtleBorder }}>
            {!isCollapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-navy/20 dark:text-white/20">Account</p>}
            {accountItems.filter(item => canViewNav(item.path)).map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                title={isCollapsed ? label : ""}
                className={`flex items-center ${isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all ${isActive(path) ? 'bg-orange/10 text-orange' : 'text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            ))}
          </div>

          {/* Collapse Toggle Button */}
          <div className="pt-4 mt-4 relative" style={{ borderTop: subtleBorder }}>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex items-center ${isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'w-full gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium text-navy/60 dark:text-white/60 hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5 transition-all`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
              {!isCollapsed && <span>Collapse Sidebar</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* ═══ Header — Liquid Glass ═══ */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-8 shrink-0 relative z-[60]"
          style={{ background: headerBg, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderBottom: subtleBorder, transition: 'background 0.3s ease' }}>
          
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden rounded-xl p-2 text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Sub-header Context */}
            <div className="hidden sm:flex items-center gap-3">
              {title && <h1 className="text-lg font-bold text-navy">{title}</h1>}
              {backTo && (
                <Link to={backTo} className="flex items-center gap-1 text-sm text-muted hover:text-navy transition-colors">
                  ← Back
                </Link>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Project Selector */}
            {projects && projects.length > 0 && (
              <div className="hidden md:flex relative group mr-2">
                <button className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-navy/80 dark:text-white/80 transition-all hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <FolderKanban className="h-4 w-4 text-orange" />
                  <span className="truncate max-w-[160px]">{location.pathname.includes('/projects/') ? projects.find(p => location.pathname.includes(p._id || p.id))?.name || 'Select Project' : 'Select Project'}</span>
                  <ChevronDown className="h-4 w-4 text-navy/60 dark:text-white/60" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-max min-w-[260px] max-w-[320px] rounded-2xl p-2 shadow-elevated opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70]"
                  style={{ background: dropdownBg, backdropFilter: 'blur(24px) saturate(180%)', border: searchBorder }}>
                  <p className="px-3 py-2 text-xs font-semibold text-navy/60 dark:text-white/60 uppercase tracking-wider">Your Projects</p>
                  <div className="max-h-60 overflow-y-auto overflow-x-hidden">
                    {projects.map(p => (
                      <Link
                        key={p._id || p.id}
                        to={`/projects/${p._id || p.id}`}
                        className="dropdown-item"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10">
                          <FolderKanban className="h-4 w-4 text-orange" />
                        </div>
                        <span className="truncate">{p.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-navy/70 dark:text-white/70 transition-all hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="hidden md:inline ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-mono text-navy/20 dark:text-white/20" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>⌘K</kbd>
            </button>

            <Link to="/about" className="rounded-full p-2 text-navy/70 dark:text-white/70 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:text-white transition-all" title="About PlinthHQ">
              <Info className="h-4 w-4" />
            </Link>

            <Switch theme={theme} toggleTheme={toggleTheme} />

            <Link to="/" className="rounded-full p-2 text-navy/70 dark:text-white/70 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:text-white transition-all" title="Back to Website">
              <Globe className="h-4 w-4" />
            </Link>

            <Link to="/notifications" className="relative rounded-full p-2 text-navy/70 dark:text-white/70 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:text-white transition-all">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={profileRef} onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
              <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-full px-2 py-1 transition-all hover:bg-navy/5 dark:hover:bg-white/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm text-xs font-bold text-navy dark:text-white"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--color-orange)), rgb(var(--color-orange-dark)))' }}>
                  {initials}
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-sm font-semibold text-navy truncate max-w-[100px]">{user?.name}</p>
                  <p className="text-[10px] text-navy/60 dark:text-white/60">{user?.role}</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 left-auto top-full mt-2 w-56 glass-dropdown z-[100]">
                  <div className="mb-1 rounded-xl px-3 py-2.5" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,40,0.03)' }}>
                    <p className="text-sm font-semibold text-navy">{user?.name}</p>
                    <p className="text-xs text-muted">{user?.email}</p>
                    <span className="mt-1 inline-block badge bg-orange/10 text-orange text-[10px]">{user?.role}</span>
                  </div>
                  <Link to="/settings" onClick={() => setProfileOpen(false)} className="dropdown-item">
                    <User className="h-4 w-4 text-muted" /> Profile & Settings
                  </Link>
                  <div className="my-1" style={{ borderTop: subtleBorder }} />
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══ Main Scrolling Content ═══ */}
        <main className={`flex-1 overflow-y-auto ${noPadding ? '' : 'p-3 sm:p-4 lg:p-8'}`}>
          {/* Sub-header shown only on mobile or if not in header */}
          {!noPadding && <div className="sm:hidden mb-4">
            {title && <h1 className="text-lg font-bold text-navy mb-1">{title}</h1>}
            {backTo && (
              <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy transition-colors">
                ← Back
              </Link>
            )}
          </div>}
          {children}
        </main>
      </div>

      {/* ═══ Mobile Menu Overlay — Liquid Glass ═══ */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-[70] backdrop-blur-sm animate-fadeIn lg:hidden" style={{ background: isDark ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,40,0.25)' }} onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-[80] w-64 flex flex-col shadow-elevated animate-slideDown lg:hidden"
            style={{ background: mobileBg, backdropFilter: 'blur(24px) saturate(180%)', borderRight: subtleBorder }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: subtleBorder }}>
              <PlinthLogo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-navy/70 dark:text-white/70 hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {directNavItems.filter(item => canViewNav(item.path)).map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive(path) ? 'bg-orange/10 text-orange' : 'text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-white'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}

              <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-navy/20 dark:text-white/20">Operations</p>
              {operationsItems.filter(item => canViewNav(item.path)).map(({ path, label, icon: Icon, comingSoon }) => (
                <button key={path} type="button" onClick={() => { if (!comingSoon) { navigate(path); setMobileOpen(false); } }} disabled={comingSoon} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all w-full text-left ${comingSoon ? 'opacity-40' : isActive(path) ? 'bg-orange/10 text-orange' : 'text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-white'}`}>
                  <Icon className="h-4 w-4" />
                  <div>
                    <span>{label}</span>
                    {comingSoon && <span className="ml-1.5 text-[9px] text-navy/60 dark:text-white/60 bg-navy/5 dark:bg-white/5 px-1 py-0.5 rounded">Soon</span>}
                  </div>
                </button>
              ))}

              <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-navy/20 dark:text-white/20">Account</p>
              {accountItems.filter(item => canViewNav(item.path)).map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive(path) ? 'bg-orange/10 text-orange' : 'text-navy/80 dark:text-white/80 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-white'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* ═══ Global Search Modal — Liquid Glass ═══ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 backdrop-blur-md p-4 animate-fadeIn" style={{ background: isDark ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,40,0.20)' }} onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl shadow-elevated overflow-hidden animate-slideDown" style={{ background: searchBg, backdropFilter: 'blur(24px) saturate(180%)', border: searchBorder }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: subtleBorder }}>
              <Search className="h-5 w-5 text-muted" />
              <input autoFocus type="text" className="flex-1 bg-transparent text-navy outline-none text-lg placeholder:text-muted/40" placeholder="Search projects, pages, team..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button onClick={() => setSearchOpen(false)} className="rounded-lg p-1 hover:bg-navy/5 dark:hover:bg-white/5 text-muted transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchQuery ? (
                <div className="space-y-4 p-2">
                  {isSearching && <div className="text-center text-navy/70 dark:text-white/70 py-4"><div className="animate-spin h-5 w-5 border-2 border-navy/20 dark:border-white/20 border-t-white rounded-full mx-auto" /></div>}
                  {!isSearching && searchResults && (
                    <>
                      {/* Projects */}
                      {searchResults.projects?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2">Projects</h4>
                          {searchResults.projects.map(p => (
                            <Link key={p._id} to={`/projects/${p._id}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange/10"><FolderKanban className="h-5 w-5 text-orange" /></div>
                              <div><p className="font-semibold text-sm">{p.name}</p><p className="text-xs text-navy/70 dark:text-white/70">{p.location?.city || p.location}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {/* Team */}
                      {searchResults.team?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2 mt-4">Team Members</h4>
                          {searchResults.team.map(u => (
                            <Link key={u._id} to="/team" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10"><User className="h-5 w-5 text-info" /></div>
                              <div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-navy/70 dark:text-white/70">{u.role}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Materials */}
                      {searchResults.materials?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2 mt-4">Materials</h4>
                          {searchResults.materials.map(m => (
                            <Link key={m._id} to="/materials" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10"><Package className="h-5 w-5 text-success" /></div>
                              <div><p className="font-semibold text-sm">{m.name}</p><p className="text-xs text-navy/70 dark:text-white/70">{m.category}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Equipment */}
                      {searchResults.equipment?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2 mt-4">Equipment</h4>
                          {searchResults.equipment.map(eq => (
                            <Link key={eq._id} to="/equipment" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10"><Wrench className="h-5 w-5 text-warning" /></div>
                              <div><p className="font-semibold text-sm">{eq.name}</p><p className="text-xs text-navy/70 dark:text-white/70">{eq.type}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Vendors */}
                      {searchResults.vendors?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2 mt-4">Vendors</h4>
                          {searchResults.vendors.map(v => (
                            <Link key={v._id} to="/vendor" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10"><Truck className="h-5 w-5 text-indigo-400" /></div>
                              <div><p className="font-semibold text-sm">{v.name}</p><p className="text-xs text-navy/70 dark:text-white/70">{v.category}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Expenses */}
                      {searchResults.expenses?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2 mt-4">Expenses</h4>
                          {searchResults.expenses.map(e => (
                            <Link key={e._id} to={`/projects/${e.project?._id || e.project}/budget`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10"><Receipt className="h-5 w-5 text-danger" /></div>
                              <div><p className="font-semibold text-sm">{e.vendor} - ₹{e.amount}</p><p className="text-xs text-navy/70 dark:text-white/70">{e.description}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Logs */}
                      {searchResults.logs?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-navy/70 dark:text-white/70 uppercase tracking-wider mb-2 px-2 mt-4">Daily Logs</h4>
                          {searchResults.logs.map(l => (
                            <Link key={l._id} to={`/projects/${l.project?._id || l.project}/logs/${l._id}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 p-3 hover:bg-navy/5 dark:hover:bg-white/5 rounded-xl text-navy dark:text-white transition-colors">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10 dark:bg-white/10"><FileText className="h-5 w-5 text-navy/80 dark:text-white/80" /></div>
                              <div><p className="font-semibold text-sm">Log from {new Date(l.date).toLocaleDateString()}</p><p className="text-xs text-navy/70 dark:text-white/70 line-clamp-1">{l.activities}</p></div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Empty State */}
                      {!Object.values(searchResults).some(arr => arr?.length > 0) && (
                        <div className="p-8 text-center text-navy/60 dark:text-white/60">
                          <p className="text-sm">No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-navy/60 dark:text-white/60">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Type to search across your workspace</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PlinthAI Chatbot Widget */}
      <PlinthAIChatbot />
    </div>
  );
}
