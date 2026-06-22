import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { issueApi, uploadApi, teamApi } from '../../api/index';
import { Plus, MoreVertical, Search, CheckCircle, AlertTriangle, Clock, Edit } from 'lucide-react';
import CustomSelectMenu from '../../components/common/CustomSelectMenu';

export default function Issues() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: issues, loading, reload } = useAsync(() => issueApi.list(id), [id]);
  const { data: team } = useAsync(() => teamApi.members(), []);

  const [showModal, setShowModal] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'Medium', assignedTo: '' });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isManager = ['PM', 'SuperAdmin', 'project_manager', 'admin', 'owner', 'Owner'].includes(user?.role);
  const currentIssue = editingIssueId ? (issues || []).find(i => i._id === editingIssueId) : null;
  const canEditFullIssue = !editingIssueId || isManager || (currentIssue?.createdBy?._id === user?.id);
  
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubmitting(true);
    try {
      const res = await uploadApi.photos(files);
      setPhotos(prev => [...prev, ...res.urls]);
    } catch (err) {
      alert('Failed to upload photos');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingIssueId(null);
    setFormData({ title: '', description: '', priority: 'Medium', assignedTo: '' });
    setPhotos([]);
    setShowModal(true);
  };

  const openEditModal = (issue) => {
    setEditingIssueId(issue._id);
    setFormData({ 
      title: issue.title, 
      description: issue.description || '', 
      priority: issue.priority, 
      assignedTo: issue.assignedTo?._id || '' 
    });
    setPhotos(issue.photos || []);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingIssueId) {
        await issueApi.update(id, editingIssueId, { ...formData, photos });
      } else {
        await issueApi.create(id, { ...formData, photos });
      }
      setShowModal(false);
      setFormData({ title: '', description: '', priority: 'Medium', assignedTo: '' });
      setPhotos([]);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (issueId, status) => {
    try {
      await issueApi.update(id, issueId, { status });
      reload();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  const safeIssues = issues || [];
  const filteredIssues = safeIssues.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (i.assignedTo?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button onClick={openCreateModal} className="btn-accent shrink-0">
          <Plus className="h-4 w-4" /> Create Issue
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredIssues.map((issue) => (
          <div key={issue._id} className="card p-5 border border-navy/5 dark:border-white/5 bg-surface hover:border-navy/10 dark:border-white/10 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                issue.priority === 'Urgent' ? 'bg-danger/10 text-danger' : 
                issue.priority === 'High' ? 'bg-orange/10 text-orange' : 
                issue.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-info/20 text-info'
              }`}>{issue.priority}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditModal(issue)}
                  className="p-1.5 rounded-lg text-muted hover:bg-navy/5 dark:hover:bg-white/5 hover:text-orange transition-colors"
                  title="Edit Issue"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <div className="relative group cursor-pointer">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${
                    issue.status === 'Resolved' || issue.status === 'Closed' ? 'bg-success/10 text-success' :
                    issue.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {issue.status === 'Resolved' ? <CheckCircle className="h-3 w-3" /> : issue.status === 'In Progress' ? <Clock className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {issue.status}
                  </span>
                  
                  {/* Status Dropdown on hover */}
                  <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-navy/10 dark:border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                      <div 
                        key={s} 
                        onClick={() => handleStatusChange(issue._id, s)}
                        className="px-4 py-2 text-sm text-navy hover:bg-surface hover:text-orange transition-colors"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="font-bold text-navy text-lg mb-2">{issue.title}</h3>
            <p className="text-sm text-muted line-clamp-2 mb-4">{issue.description || 'No description provided.'}</p>
            
            {issue.photos?.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {issue.photos.map((p, i) => (
                  <img key={i} src={p} alt="Issue photo" className="h-12 w-12 object-cover rounded-lg border border-navy/10 dark:border-white/10 flex-shrink-0" />
                ))}
              </div>
            )}
            
            <div className="mt-auto pt-4 border-t border-navy/5 dark:border-white/5 flex justify-between items-center text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-orange/20 text-orange flex items-center justify-center font-bold">
                  {(issue.assignedTo?.name || '?').charAt(0).toUpperCase()}
                </span>
                <span>{issue.assignedTo?.name || 'Unassigned'}</span>
              </div>
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {filteredIssues.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted card">
            <AlertTriangle className="mx-auto h-12 w-12 opacity-20 mb-3" />
            <p>No issues found.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop z-50">
          <div className="modal-content max-w-lg p-6">
            <h3 className="font-display text-xl font-bold text-navy mb-4 border-b border-navy/10 dark:border-white/10 pb-3">
              {editingIssueId ? 'Edit Issue' : 'Create New Issue'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className={`input-field ${!canEditFullIssue ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  required 
                  disabled={!canEditFullIssue}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className={`input-field min-h-[80px] ${!canEditFullIssue ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canEditFullIssue}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Priority</label>
                  <CustomSelectMenu
                    value={formData.priority}
                    onChange={(val) => setFormData({...formData, priority: val})}
                    options={[
                      {value: 'Low', label: 'Low'},
                      {value: 'Medium', label: 'Medium'},
                      {value: 'High', label: 'High'},
                      {value: 'Urgent', label: 'Urgent'}
                    ]}
                    disabled={!canEditFullIssue}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Assign To</label>
                  <CustomSelectMenu
                    value={formData.assignedTo}
                    onChange={(val) => setFormData({...formData, assignedTo: val})}
                    options={(team || []).map(m => ({ value: m._id, label: `${m.name} (${m.role})` }))}
                    placeholder="Unassigned"
                    disabled={!canEditFullIssue}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Photos (Optional)</label>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={submitting} className="input-field text-sm" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative group">
                      <img src={p} alt="upload" className="h-16 w-16 object-cover rounded-lg" />
                      <button 
                        type="button" 
                        onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-navy/10 dark:border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : (editingIssueId ? 'Save Changes' : 'Create Issue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
