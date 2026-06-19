import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flag, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { milestoneApi } from '../../api/index';
import { X, Save } from 'lucide-react';
import CustomSelectMenu from '../../components/common/CustomSelectMenu';

import GlassDatePicker from '../../components/common/GlassDatePicker';
const statusIcons = { completed: CheckCircle, inProgress: Clock, planned: Flag, delayed: AlertTriangle };
const barColors = { completed: 'bg-success', inProgress: 'bg-orange', planned: 'bg-navy/30', delayed: 'bg-danger' };

export default function Milestones() {
  const { id } = useParams();
  const { data: milestones = [], loading, reload } = useAsync(() => milestoneApi.list(id), [id]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    weightage: 10,
    status: 'planned'
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await milestoneApi.create(id, formData);
      setShowCreateModal(false);
      setFormData({ title: '', startDate: '', endDate: '', weightage: 10, status: 'planned' });
      reload();
    } catch (err) {
      alert('Error creating milestone: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (mId, newStatus) => {
    try {
      await milestoneApi.update(id, mId, { status: newStatus });
      reload();
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-bold text-navy flex items-center gap-2">Project Milestones</h3>
        <button onClick={() => setShowCreateModal(true)} className="btn-accent"><Plus className="h-4 w-4" /> New Milestone</button>
      </div>
      
      {milestones.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-navy/10 rounded-xl bg-surface">
          <Flag className="mx-auto h-10 w-10 text-muted/30 mb-3" />
          <h4 className="text-lg font-bold text-navy">No Milestones Yet</h4>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto">
            Milestones help you track major project phases like "Foundation Pour", "Framing Completed", or "Final Inspection". Adding milestones allows you to visualize progress against your scheduled timeline.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="mt-6 btn-accent inline-flex"><Plus className="h-4 w-4 mr-1.5" /> Add First Milestone</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((m) => {
          const Icon = statusIcons[m.status] || Flag;
          const mid = m._id || m.id;
          return (
            <div key={mid} className="card">
              <div className="flex items-start justify-between">
                <Icon className={`h-5 w-5 ${m.status === 'completed' ? 'text-success' : m.status === 'inProgress' ? 'text-orange' : 'text-muted'}`} />
                <CustomSelectMenu 
                  value={m.status} 
                  onChange={(val) => handleUpdateStatus(mid, val)}
                  options={[
                    {value: 'planned', label: 'Planned'},
                    {value: 'inProgress', label: 'In Progress'},
                    {value: 'completed', label: 'Completed'},
                    {value: 'delayed', label: 'Delayed'}
                  ]}
                  placeholder="Status"
                  className="w-36"
                />
              </div>
              <h4 className="mt-3 font-bold text-navy">{m.title}</h4>
              <p className="mt-1 text-xs text-muted">{formatDate(m.startDate)} — {formatDate(m.endDate)}</p>
              <p className="mt-3 text-xs text-muted">Weight: {m.weightage}%</p>
            </div>
          );
        })}
      </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between border-b border-navy/5 pb-4">
              <h2 className="text-xl font-bold text-navy">Create Milestone</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-navy transition"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">Milestone Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field py-2" placeholder="e.g., Foundation Complete" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">Start Date</label>
                  <GlassDatePicker required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="input-field py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">End Date</label>
                  <GlassDatePicker required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="input-field py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">Status</label>
                  <CustomSelectMenu 
                    value={formData.status} 
                    onChange={val => setFormData({...formData, status: val})}
                    options={[
                      {value: 'planned', label: 'Planned'},
                      {value: 'inProgress', label: 'In Progress'},
                      {value: 'completed', label: 'Completed'},
                      {value: 'delayed', label: 'Delayed'}
                    ]}
                    placeholder="Status"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">Weightage (%)</label>
                  <input type="number" min="1" max="100" required value={formData.weightage} onChange={e => setFormData({...formData, weightage: Number(e.target.value)})} className="input-field py-2" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-semibold text-navy hover:bg-info rounded-lg transition">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent py-2"><Save className="mr-2 h-4 w-4" /> {submitting ? 'Saving...' : 'Save Milestone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
