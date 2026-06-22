import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, LayoutGrid, List, Clock, IndianRupee, MapPin, Building, Building2, Activity, Trash2, Edit2, Pencil, Play, Pause, CheckCircle } from 'lucide-react';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
import AppLayout from '../components/layout/AppLayout';
import ProjectCard from '../components/common/ProjectCard';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { projectApi, uploadApi } from '../api/index';

import GlassDatePicker from '../components/common/GlassDatePicker';
export default function ProjectsList() {
  const { user } = useAuth();
  const { data: projects, loading, refresh } = useAsync(() => projectApi.list(), []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    location: '', 
    state: '',
    progress: 0,
    totalBudget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    coverPhoto: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const safeProjects = projects || [];
  
  // Filtering logic
  const filteredProjects = safeProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [createError, setCreateError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError('');
    try {
      const payload = {
        ...formData,
        location: { city: formData.location, state: formData.state },
        totalBudget: Number(formData.totalBudget)
      };
      await projectApi.create(payload);
      setShowCreateModal(false);
      setFormData({ 
        name: '', description: '', location: '', state: '', progress: 0, totalBudget: '', 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        coverPhoto: '' 
      });
      refresh();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create project';
      if (err.response?.status === 403 && msg.includes('plan')) {
        setCreateError(msg);
      } else {
        setCreateError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        location: { city: formData.location, state: formData.state },
        totalBudget: Number(formData.totalBudget)
      };
      await projectApi.update(selectedProject._id || selectedProject.id, payload);
      setShowEditModal(false);
      setSelectedProject(null);
      refresh();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await projectApi.delete(selectedProject._id || selectedProject.id);
      setShowDeleteModal(false);
      setSelectedProject(null);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (p) => {
    setSelectedProject(p);
    let city = '';
    let state = '';
    if (typeof p.location === 'string') {
      const parts = p.location.split(', ');
      city = parts[0] || '';
      state = parts[1] || '';
    } else if (p.location) {
      city = p.location.city || '';
      state = p.location.state || '';
    }
    setFormData({
      name: p.name,
      description: p.description,
      location: city,
      state: state,
      progress: p.progress || 0,
      totalBudget: p.totalBudget,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      coverPhoto: p.coverPhoto || ''
    });
    setShowEditModal(true);
  };

  const openDelete = (p) => {
    setSelectedProject(p);
    setShowDeleteModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSubmitting(true);
      const data = await uploadApi.file(file);
      setFormData(prev => ({ ...prev, coverPhoto: data.url }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Projects">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Projects">
      <div className="animate-fadeIn">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
              <CustomSelectMenu
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'planning', label: 'Planning' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'onHold', label: 'On Hold' }
                ]}
                placeholder="All Status"
                className="w-40"
                icon={Filter}
              />
          </div>
          {['PM', 'project_manager', 'admin', 'SuperAdmin', 'owner', 'Owner'].includes(user?.role) && (
            <button onClick={() => setShowCreateModal(true)} className="btn-accent shrink-0">
              <Plus className="h-4 w-4" /> New Project
            </button>
          )}
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((p) => (
              <div key={p._id || p.id} className="relative group">
                <ProjectCard project={{ ...p, id: p._id || p.id, team: p.teamCount || p.team?.length || 0 }} />
                {['PM', 'project_manager', 'admin', 'SuperAdmin', 'owner', 'Owner'].includes(user?.role) && (
                  <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
                    <button onClick={(e) => { e.preventDefault(); openEdit(p); }} className="p-1.5 bg-black/50 hover:bg-orange/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-orange transition shadow-sm backdrop-blur">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.preventDefault(); openDelete(p); }} className="p-1.5 bg-black/50 hover:bg-danger/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-danger transition shadow-sm backdrop-blur">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-glass-border)] bg-card/50 backdrop-blur-sm p-12 text-center animate-slideUp">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
              <Building2 className="h-8 w-8 text-muted/60" />
            </div>
            <h4 className="mt-5 text-base font-bold text-navy tracking-tight">No projects found</h4>
            <p className="mt-2 max-w-xs text-sm text-muted">
              {searchQuery ? "Try adjusting your search or filters." : "You haven't added any projects yet. Create your first project to get started."}
            </p>
            {!searchQuery && ['PM', 'project_manager', 'admin', 'SuperAdmin', 'owner', 'Owner'].includes(user?.role) && (
              <button onClick={() => setShowCreateModal(true)} className="btn-accent mt-6">
                <Plus className="h-4 w-4" /> Create First Project
              </button>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-backdrop z-[100]">
            <div className="modal-content max-w-lg p-6 sm:p-8 border border-[var(--color-glass-border)] shadow-elevated">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-navy tracking-tight">Create New Project</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-navy transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-5">
                {createError && (
                  <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger animate-fadeIn">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p>{createError}</p>
                      {createError.includes('plan') && (
                        <Link to="/billing" className="mt-1 inline-block font-semibold text-orange hover:text-orange-dark underline text-xs">
                          Upgrade your plan →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
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
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Initial Progress (%)</label>
                    <input type="number" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} className="input-field" min="0" max="100" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Cover Photo</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-glass-border)] bg-surface/50 px-4 py-6 text-sm font-semibold text-navy transition-colors hover:border-orange hover:bg-orange/5 hover:text-orange">
                        <Plus className="h-5 w-5" />
                        <span>Click to upload image</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={submitting} className="hidden" />
                    </label>
                    {formData.coverPhoto && <img src={formData.coverPhoto} alt="Cover" className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-sm border border-[var(--color-glass-border)]" />}
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-[var(--color-glass-border)]">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary px-6">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary px-8">
                    {submitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedProject && (
          <div className="modal-backdrop z-[100]">
            <div className="modal-content max-w-lg p-6 sm:p-8 border border-[var(--color-glass-border)] shadow-elevated">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-navy tracking-tight">Edit Project</h3>
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
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-glass-border)] bg-surface/50 px-4 py-6 text-sm font-semibold text-navy transition-colors hover:border-orange hover:bg-orange/5 hover:text-orange">
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
                  <button type="submit" disabled={submitting} className="btn-primary px-8">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProject && (
          <div className="modal-backdrop z-[100]">
            <div className="modal-content max-w-md p-8 text-center border border-[var(--color-glass-border)] shadow-elevated">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <AlertTriangle className="h-8 w-8 text-danger" />
              </div>
              <h3 className="text-2xl font-bold text-navy tracking-tight">Delete Project?</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-navy">{selectedProject.name}</span>? 
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
      </div>
    </AppLayout>
  );
}
