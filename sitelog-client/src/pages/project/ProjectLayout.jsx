import { useState, useRef, useEffect } from 'react';
import { Link, useParams, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, ClipboardList, Users, Package, Receipt, PieChart,
  Flag, FileText, Eye, Pencil, Trash2, MoreVertical, Plus,
  ChevronDown, Briefcase, CalendarCheck, Wrench, AlertTriangle, Image, MessageSquare
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAsync } from '../../hooks/useAsync';
import { projectApi, uploadApi, equipmentApi } from '../../api/index';

import GlassDatePicker from '../../components/common/GlassDatePicker';
/* ── Project Navigation Structure ── */
const operationsItems = [
  { path: 'logs', label: 'Daily Logs', icon: ClipboardList },
  { path: 'issues', label: 'Issues', icon: AlertTriangle },
  { path: 'gallery', label: 'Gallery', icon: Image },
  { path: 'attendance', label: 'Attendance', icon: Users },
  { path: 'materials', label: 'Materials', icon: Package },
  { path: 'expenses', label: 'Expenses', icon: Receipt },
];

const budgetItems = [
  { path: 'budget', label: 'Budget', icon: PieChart },
  { path: 'milestones', label: 'Milestones', icon: Flag },
];

export default function ProjectLayout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { data: project, loading, error, refresh } = useAsync(() => projectApi.get(id), [id]);
  const basePath = `/projects/${id}`;
  const isOverview = location.pathname === basePath || location.pathname === `${basePath}/`;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // 'operations' | 'budget' | null
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleMouseEnter = (name) => {
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const canViewProjectTab = (path) => {
    const role = user?.role;
    if (['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(role)) return true;
    if (['site_engineer', 'Engineer', 'Labour', 'contractor'].includes(role)) {
      if (['expenses', 'budget', 'milestones', 'owner'].includes(path)) return false;
      return true;
    }
    if (['accounts', 'Accounts'].includes(role)) {
      if (['logs', 'attendance', 'owner'].includes(path)) return false;
      return true;
    }
    return true;
  };

  const allowedOperationsItems = operationsItems.filter(item => canViewProjectTab(item.path));
  const allowedBudgetItems = budgetItems.filter(item => canViewProjectTab(item.path));

  const isActiveTab = (path) => {
    if (path === '') return isOverview;
    return location.pathname.includes(`/${path}`);
  };

  const isDropdownActive = (items) => items.some(item => isActiveTab(item.path));

  const openEdit = () => {
    setFormData({
      name: project.name,
      description: project.description,
      location: project.location,
      state: project.state || '',
      progress: project.progress || 0,
      totalBudget: project.totalBudget,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      coverPhoto: project.coverPhoto || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        location: { city: formData.location },
        totalBudget: Number(formData.totalBudget)
      };
      await projectApi.update(id, payload);
      setShowEditModal(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await projectApi.delete(id);
      setShowDeleteModal(false);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const data = await uploadApi.file(file);
      setFormData(prev => ({ ...prev, coverPhoto: data.url }));
    } catch (err) {
      alert('Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout backTo="/projects">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" />
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout backTo="/projects">
        <p className="text-danger">{error || 'Project not found'}</p>
      </AppLayout>
    );
  }

  const pid = project._id || project.id;

  return (
    <AppLayout backTo="/projects">
      <div className="mb-6 overflow-hidden rounded-2xl shadow-elevated relative" style={{ background: theme === 'dark' ? 'rgba(16,18,24,0.40)' : 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative h-36 sm:h-48 lg:h-64">
          {project.coverPhoto ? (
            <img src={project.coverPhoto} alt={project.name} className="h-full w-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #0f172a 100%)' : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(var(--color-card)), rgba(var(--color-card), 0.5), transparent)' }} />
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge status={project.status} />
              <span className={`font-mono text-sm font-semibold tracking-wide uppercase px-2.5 py-1 rounded-lg backdrop-blur-sm ${theme === 'dark' ? 'text-white/70' : 'text-navy/90'}`} style={{ background: theme === 'dark' ? 'rgba(16,18,24,0.50)' : 'rgba(255,255,255,0.50)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,40,0.08)' }}>{project.location?.city || project.location || 'Unknown'}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="font-display text-xl sm:text-3xl font-bold text-navy lg:text-4xl tracking-tight">{project.name}</h1>
                  <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm text-muted font-medium line-clamp-2">{project.description}</p>
                </div>
                {['PM', 'SuperAdmin', 'project_manager', 'admin', 'owner', 'Owner'].includes(user?.role) && (
                  <div className="flex gap-2 self-start mt-2">
                    <button onClick={openEdit} className="p-1.5 bg-navy/5 dark:bg-black/50 hover:bg-orange/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-orange transition shadow-sm backdrop-blur" title="Edit Project">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-1.5 bg-navy/5 dark:bg-black/50 hover:bg-danger/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-danger transition shadow-sm backdrop-blur" title="Delete Project">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 sm:mt-6 flex flex-wrap gap-3 sm:gap-8 text-xs sm:text-sm text-muted border-t border-[var(--color-glass-border)] pt-3 sm:pt-4">
              <span className="font-medium">Budget: <strong className="font-mono text-navy text-base ml-1">{formatCurrency(project.totalBudget)}</strong></span>
              <span className="font-medium">Progress: <strong className="font-mono text-orange text-base ml-1">{project.progress}%</strong></span>
              <span className="font-medium">Timeline: <span className="text-navy font-semibold ml-1">{formatDate(project.startDate)} — {formatDate(project.endDate)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* â•â•â• Project Horizontal Nav â•â•â• */}
      <div className="mb-6 pb-2" ref={dropdownRef}>
        <div className="flex flex-wrap items-center gap-2 px-1">
          {/* Project Overview — standalone */}
          <Link
            to={basePath}
            className={`project-nav-pill ${isOverview ? 'project-nav-pill-active' : ''}`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Project Overview</span>
          </Link>

          {/* Operations Dropdown */}
          {allowedOperationsItems.length > 0 && (
            <div className="relative" onMouseEnter={() => handleMouseEnter('operations')} onMouseLeave={handleMouseLeave}>
              <button
                type="button"
                onClick={() => toggleDropdown('operations')}
                className={`project-nav-pill ${isDropdownActive(allowedOperationsItems) ? 'project-nav-pill-active' : ''}`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Operations</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openDropdown === 'operations' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'operations' && (
                <div className="left-0 glass-dropdown max-w-[85vw]">
                  {allowedOperationsItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={`${basePath}/${path}`}
                      onClick={() => setOpenDropdown(null)}
                      className={`dropdown-item ${isActiveTab(path) ? 'text-orange bg-orange/5' : ''}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActiveTab(path) ? 'bg-orange/20' : 'bg-orange/10'}`}>
                        <Icon className={`h-4 w-4 ${isActiveTab(path) ? 'text-orange' : 'text-orange/70'}`} />
                      </div>
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Budget & Milestones Dropdown */}
          {allowedBudgetItems.length > 0 && (
            <div className="relative" onMouseEnter={() => handleMouseEnter('budget')} onMouseLeave={handleMouseLeave}>
              <button
                type="button"
                onClick={() => toggleDropdown('budget')}
                className={`project-nav-pill ${isDropdownActive(allowedBudgetItems) ? 'project-nav-pill-active' : ''}`}
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Budget & Milestones</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openDropdown === 'budget' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'budget' && (
                <div className="left-0 glass-dropdown max-w-[85vw]">
                  {allowedBudgetItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={`${basePath}/${path}`}
                      onClick={() => setOpenDropdown(null)}
                      className={`dropdown-item ${isActiveTab(path) ? 'text-orange bg-orange/5' : ''}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActiveTab(path) ? 'bg-orange/20' : 'bg-orange/10'}`}>
                        <Icon className={`h-4 w-4 ${isActiveTab(path) ? 'text-orange' : 'text-orange/70'}`} />
                      </div>
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team & Chat Dropdown */}
          <div className="relative" onMouseEnter={() => handleMouseEnter('teamChat')} onMouseLeave={handleMouseLeave}>
            <button
              type="button"
              onClick={() => toggleDropdown('teamChat')}
              className={`project-nav-pill ${['/team', '/chat'].includes(location.pathname) ? 'project-nav-pill-active' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span>Team & Chat</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openDropdown === 'teamChat' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'teamChat' && (
              <div className="right-0 glass-dropdown max-w-[85vw]">
                {[
                  { path: '/team', label: 'Manage Team', icon: Users },
                  { path: '/chat', label: 'Project Chat', icon: MessageSquare }
                ].map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setOpenDropdown(null)}
                    className={`dropdown-item ${location.pathname === path ? 'text-orange bg-orange/5' : ''}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${location.pathname === path ? 'bg-orange/20' : 'bg-orange/10'}`}>
                      <Icon className={`h-4 w-4 ${location.pathname === path ? 'text-orange' : 'text-orange/70'}`} />
                    </div>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Documents — standalone */}
          <Link
            to={`${basePath}/documents`}
            className={`project-nav-pill ${isActiveTab('documents') ? 'project-nav-pill-active' : ''}`}
          >
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </Link>

          {/* Owner Dashboard — standalone */}
          {canViewProjectTab('owner') && (
            <Link
              to={`${basePath}/owner`}
              className={`project-nav-pill ${isActiveTab('owner') ? 'project-nav-pill-active' : ''}`}
            >
              <Eye className="h-4 w-4" />
              <span>Owner Dashboard</span>
            </Link>
          )}
        </div>
      </div>

      <Outlet context={{ project: { ...project, id: pid } }} />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-backdrop z-[100]">
          <div className="modal-content max-w-lg p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-navy tracking-tight">Edit Project</h3>
            </div>
            <form onSubmit={handleEdit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Project Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field min-h-[100px] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">City / Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" placeholder="e.g. Pune" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input-field" placeholder="e.g. Maharashtra" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Start Date *</label>
                  <GlassDatePicker value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">End Date *</label>
                  <GlassDatePicker value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Total Budget (₹) *</label>
                  <input type="number" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })} className="input-field" required min="0" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Current Progress (%)</label>
                  <input type="number" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} className="input-field" min="0" max="100" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Cover Photo</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-glass-border)] bg-info/50 px-4 py-6 text-sm font-semibold text-navy transition-colors hover:border-orange hover:bg-orange/5 hover:text-orange">
                      <Pencil className="h-5 w-5" />
                      <span>Click to update image</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={submitting} className="hidden" />
                  </label>
                  {formData.coverPhoto && <img src={formData.coverPhoto} alt="Cover" className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-sm border border-[var(--color-glass-border)]" />}
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary px-6">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop z-[100]">
          <div className="modal-content max-w-md p-8 text-center border border-[var(--color-glass-border)] shadow-elevated">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <AlertTriangle className="h-8 w-8 text-danger" />
            </div>
            <h3 className="text-2xl font-bold text-navy tracking-tight">Delete Project?</h3>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-navy">{project.name}</span>? 
              This action cannot be undone and will remove all associated logs, budget, and documents.
            </p>
            <div className="mt-8 flex justify-center gap-3 pt-6 border-t border-[var(--color-glass-border)]">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-secondary w-full py-2.5">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={submitting} className="btn-danger w-full py-2.5 shadow-lg shadow-danger/20">
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export function ProjectOverview() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: project } = useAsync(() => projectApi.get(id), [id]);
  const { data: equipment = [] } = useAsync(() => equipmentApi.list({ project: id }), [id]);
  
  if (!project) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isHistory = (eq) => {
    if (eq.status === 'Retired') return true;
    if (eq.type === 'Rented' && eq.rentalEndDate) {
      const end = new Date(eq.rentalEndDate);
      end.setHours(0, 0, 0, 0);
      return end < today;
    }
    return false;
  };

  const activeEquipment = equipment.filter(eq => !isHistory(eq) && (eq.assignedProject?._id === id || eq.assignedProject === id));

  const canViewProjectTab = (path) => {
    const role = user?.role;
    if (['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(role)) return true;
    if (['site_engineer', 'Engineer', 'Labour', 'contractor'].includes(role)) {
      if (['expenses', 'budget', 'milestones', 'owner'].includes(path)) return false;
      return true;
    }
    if (['accounts', 'Accounts'].includes(role)) {
      if (['logs', 'attendance', 'owner'].includes(path)) return false;
      return true;
    }
    return true;
  };

  const pid = project._id || project.id;
  const spentPct = project.totalBudget ? Math.round(((project.spent || 0) / project.totalBudget) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <h3 className="font-bold text-navy flex items-center gap-2 tracking-tight"><LayoutGrid className="h-5 w-5 text-orange" /> Project Progress</h3>
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted font-medium">Overall completion</span>
              <span className="font-mono font-bold text-navy">{project.progress || 0}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full bg-gradient-to-r from-orange to-orange-dark transition-all duration-1000" style={{ width: `${project.progress || 0}%` }} />
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-navy flex items-center gap-2 tracking-tight"><Plus className="h-5 w-5 text-orange" /> Quick Actions</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { to: 'logs', label: 'Create Daily Log', desc: "Record today's site activities", icon: ClipboardList },
              { to: 'budget', label: 'View Budget', desc: 'Track spending vs allocation', icon: PieChart },
              { to: 'milestones', label: 'Milestones', desc: 'Timeline and approvals', icon: Flag },
              { to: 'documents', label: 'Upload Document', desc: 'Drawings, permits, BOQ', icon: FileText },
            ].filter(item => canViewProjectTab(item.to)).map(({ to, label, desc, icon: Icon }) => (
              <Link key={to} to={`/projects/${pid}/${to}`} className="group flex items-start gap-3 rounded-xl p-4 transition-all hover:shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 transition-all group-hover:bg-orange">
                  <Icon className="h-5 w-5 text-orange transition-colors group-hover:text-navy dark:text-white" />
                </div>
                <div>
                  <p className="font-semibold text-navy group-hover:text-orange transition-colors">{label}</p>
                  <p className="mt-1 text-xs text-muted font-medium">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-navy flex items-center gap-2 tracking-tight"><Wrench className="h-5 w-5 text-orange" /> Equipment on Site</h3>
          <div className="mt-5 space-y-3">
            {activeEquipment.length > 0 ? activeEquipment.map(eq => (
              <div key={eq._id || eq.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-glass-border)] bg-info/20">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${eq.status === 'Active' ? 'bg-success/10 text-success' : eq.status === 'Under Maintenance' ? 'bg-warning/10 text-warning' : 'bg-info text-muted'}`}>
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy text-sm">{eq.name}</p>
                    <p className="text-xs text-muted">{eq.type} • {eq.status}</p>
                  </div>
                </div>
                {eq.type === 'Rented' && (
                  <div className="text-right">
                    <p className="text-xs text-muted">Daily Rent</p>
                    <p className="font-mono text-sm font-bold text-orange">{formatCurrency(eq.dailyRate)}</p>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted text-center py-4">No equipment assigned to this project.</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {canViewProjectTab('budget') && (
          <div className="card">
            <h3 className="font-bold text-navy flex items-center gap-2 tracking-tight"><PieChart className="h-5 w-5 text-orange" /> Budget Summary</h3>
            <div className="mt-5 space-y-4">
              <div className="flex justify-between text-sm"><span className="text-muted font-medium">Total Budget</span><span className="font-mono font-bold text-navy">{formatCurrency(project.totalBudget)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted font-medium">Amount Spent</span><span className="font-mono font-bold text-orange">{formatCurrency(project.spent || 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted font-medium">Remaining</span><span className="font-mono font-bold text-success">{formatCurrency((project.totalBudget || 0) - (project.spent || 0))}</span></div>
            
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted font-medium">Utilization</span>
                <span className="font-mono font-bold text-navy">{spentPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className={`h-full rounded-full transition-all duration-1000 ${spentPct > 80 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${Math.min(spentPct, 100)}%` }} />
              </div>
            </div>
            </div>
          </div>
        )}
        <div className="card relative overflow-hidden group">
          <h3 className="font-bold text-navy flex items-center gap-2 tracking-tight relative z-10"><Users className="h-5 w-5 text-orange" /> Team</h3>
          <p className="mt-4 font-mono text-4xl font-bold text-navy relative z-10 tracking-tight">{project.teamCount || 0}</p>
          <p className="text-sm text-muted font-medium mt-1 relative z-10">Active members on site</p>
          <Link to="/team" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange hover:text-orange-dark transition-colors relative z-10">Manage team <span className="text-lg">→</span></Link>
        </div>
      </div>
    </div>
  );
}
