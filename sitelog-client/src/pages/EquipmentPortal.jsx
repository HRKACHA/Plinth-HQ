import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Plus, Search, Filter, Settings, Activity, Wrench, IndianRupee, Clock, History, AlertTriangle, X, Trash2, Pencil, CheckCircle, MapPin, Map, FileText, ChevronRight } from 'lucide-react';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
import { formatCurrency } from '../data/mockData';
import { useAsync } from '../hooks/useAsync';
import { equipmentApi, projectApi } from '../api/index';

import GlassDatePicker from '../components/common/GlassDatePicker';
const CATEGORIES = ['Excavator', 'Crane', 'Loader', 'Mixer', 'Scaffolding', 'Truck', 'Generator', 'Compactor', 'Tools', 'Other'];
const STATUSES = ['Active', 'Idle', 'Under Maintenance', 'Retired'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

export default function EquipmentPortal() {
  const { data: equipment, loading, refresh } = useAsync(() => equipmentApi.list(), []);
  const { data: maintenanceDue } = useAsync(() => equipmentApi.maintenanceDue(), []);
  const { data: projects } = useAsync(() => projectApi.list(), []);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showServiceHistory, setShowServiceHistory] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'history'

  const [form, setForm] = useState({
    name: '', category: 'Other', type: 'Owned', serialNumber: '', status: 'Idle',
    condition: 'Good', notes: '', purchaseDate: '', purchaseCost: '', dailyRate: '',
    rentalVendor: '', rentalStartDate: '', rentalEndDate: '', nextMaintenanceDate: '', assignedProject: '',
  });
  const [serviceForm, setServiceForm] = useState({
    type: 'Routine Maintenance', description: '', cost: '', serviceDate: new Date().toISOString().split('T')[0],
    nextDueDate: '', performedBy: '',
  });
  const [assignProject, setAssignProject] = useState('');

  const safeEquipment = equipment || [];
  const safeMaintDue = maintenanceDue || [];
  const safeProjects = projects || [];

  // Compute Active vs History Equipment
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isHistory = (eq) => {
    if (eq.status === 'Retired') return true;
    if (eq.type === 'Rented' && eq.rentalEndDate) {
      const end = new Date(eq.rentalEndDate);
      end.setHours(0, 0, 0, 0);
      return end <= today;
    }
    return false;
  };

  const historyEquipment = safeEquipment.filter(isHistory);
  const activeEquipment = safeEquipment.filter(eq => !isHistory(eq));

  const displayList = viewMode === 'active' ? activeEquipment : historyEquipment;

  const filtered = displayList.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || e.type === typeFilter;
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const activeCount = activeEquipment.filter(e => e.status === 'Active').length;
  const maintCount = activeEquipment.filter(e => e.status === 'Under Maintenance').length;
  const rentalBurn = activeEquipment.filter(e => e.type === 'Rented' && e.status === 'Active').reduce((s, e) => s + (e.dailyRate || 0), 0);

  const resetForm = () => setForm({
    name: '', category: 'Other', type: 'Owned', serialNumber: '', status: 'Idle',
    condition: 'Good', notes: '', purchaseDate: '', purchaseCost: '', dailyRate: '',
    rentalVendor: '', rentalStartDate: '', rentalEndDate: '', nextMaintenanceDate: '', assignedProject: '',
  });

  const handleAdd = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await equipmentApi.create(form); setShowAddModal(false); resetForm(); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await equipmentApi.update(selectedEquipment._id || selectedEquipment.id, form); setShowEditModal(false); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (eq) => {
    if (!confirm(`Delete "${eq.name}"? This removes all service history.`)) return;
    try { await equipmentApi.delete(eq._id || eq.id); refresh(); }
    catch { alert('Failed to delete'); }
  };

  const openEdit = (eq) => {
    setSelectedEquipment(eq);
    setForm({
      name: eq.name, category: eq.category, type: eq.type, serialNumber: eq.serialNumber || '',
      status: eq.status, condition: eq.condition, notes: eq.notes || '',
      purchaseDate: eq.purchaseDate ? new Date(eq.purchaseDate).toISOString().split('T')[0] : '',
      purchaseCost: eq.purchaseCost || '', dailyRate: eq.dailyRate || '',
      rentalVendor: eq.rentalVendor || '',
      rentalStartDate: eq.rentalStartDate ? new Date(eq.rentalStartDate).toISOString().split('T')[0] : '',
      rentalEndDate: eq.rentalEndDate ? new Date(eq.rentalEndDate).toISOString().split('T')[0] : '',
      nextMaintenanceDate: eq.nextMaintenanceDate ? new Date(eq.nextMaintenanceDate).toISOString().split('T')[0] : '',
      assignedProject: eq.assignedProject?._id || eq.assignedProject || '',
    });
    setShowEditModal(true);
  };

  const openAssign = (eq) => {
    setSelectedEquipment(eq);
    setAssignProject(eq.assignedProject?._id || eq.assignedProject || '');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    setSubmitting(true);
    try { await equipmentApi.assign(selectedEquipment._id || selectedEquipment.id, { projectId: assignProject || null }); setShowAssignModal(false); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const openServiceAdd = (eq) => {
    setSelectedEquipment(eq);
    setServiceForm({ type: 'Routine Maintenance', description: '', cost: '', serviceDate: new Date().toISOString().split('T')[0], nextDueDate: '', performedBy: '' });
    setShowServiceModal(true);
  };

  const handleServiceAdd = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await equipmentApi.addService(selectedEquipment._id || selectedEquipment.id, serviceForm); setShowServiceModal(false); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const openServiceHistory = async (eq) => {
    setSelectedEquipment(eq); setShowServiceHistory(true);
    try { const logs = await equipmentApi.listService(eq._id || eq.id); setServiceLogs(logs); }
    catch { setServiceLogs([]); }
  };

  const statusColor = (s) => {
    if (s === 'Active') return 'bg-success/10 text-success';
    if (s === 'Idle') return 'bg-info text-muted';
    if (s === 'Under Maintenance') return 'bg-warning/10 text-warning';
    return 'bg-danger/10 text-danger';
  };

  const condColor = (c) => {
    if (c === 'Excellent') return 'text-success';
    if (c === 'Good') return 'text-navy';
    if (c === 'Fair') return 'text-warning';
    return 'text-danger';
  };

  return (
    <AppLayout title="Equipment — Assets, Rentals & Maintenance">
      <div className="space-y-4 sm:space-y-6">
        {/* Maintenance Due Alert */}
        {safeMaintDue.length > 0 && (
          <div className="rounded-2xl bg-warning/5 border border-warning/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-navy">Maintenance Due</p>
              <p className="text-sm text-muted mt-1">
                {safeMaintDue.length} item{safeMaintDue.length > 1 ? 's need' : ' needs'} maintenance within 7 days:{' '}
                <span className="font-semibold text-navy">{safeMaintDue.map(e => e.name).join(', ')}</span>
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Active', value: activeEquipment.length, icon: Wrench, accent: 'text-orange bg-orange/10' },
            { label: 'Active On-Site', value: activeCount, icon: Activity, accent: 'text-success bg-success/10' },
            { label: 'Under Maintenance', value: maintCount, icon: Settings, accent: maintCount > 0 ? 'text-warning bg-warning/10' : 'text-muted bg-info' },
            { label: 'Rental Burn / Day', value: formatCurrency(rentalBurn), icon: IndianRupee, accent: 'text-navy bg-info' },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="card flex items-center gap-3 sm:gap-4">
              <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${accent}`}>
                <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wider leading-tight">{label}</p>
                <p className="font-mono text-base sm:text-xl font-bold text-navy mt-0.5 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex bg-surface border border-white/[0.06] rounded-xl p-1 w-fit">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'active' ? 'bg-navy/10 dark:bg-white/10 text-navy dark:text-white' : 'text-muted hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5'
            }`}
          >
            Active Equipment ({activeEquipment.length})
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'history' ? 'bg-navy/10 dark:bg-white/10 text-navy dark:text-white' : 'text-muted hover:text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/5'
            }`}
          >
            History Box ({historyEquipment.length})
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type="text" placeholder="Search equipment or serial..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <CustomSelectMenu
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: '', label: 'All Types' },
              { value: 'Owned', label: 'Owned' },
              { value: 'Rented', label: 'Rented' }
            ]}
            placeholder="All Types"
            className="w-auto min-w-[120px]"
          />
          <CustomSelectMenu
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All Status' },
              ...STATUSES.map(s => ({ value: s, label: s }))
            ]}
            placeholder="All Status"
            className="w-auto min-w-[140px]"
          />
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-accent shrink-0"><Plus className="h-4 w-4" /> Add Equipment</button>
        </div>

        {/* Equipment Cards */}
        {loading ? (
          <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(eq => (
              <div key={eq._id || eq.id} className="card group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                {/* Type badge */}
                <div className="absolute top-4 right-4 flex gap-1">
                  {viewMode === 'history' && eq.status !== 'Retired' && (
                    <span className="badge text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">Expired</span>
                  )}
                  {viewMode === 'history' && eq.status === 'Retired' && (
                    <span className="badge text-[10px] font-bold bg-muted/20 text-muted border border-muted/30">Retired</span>
                  )}
                  <span className={`badge text-[10px] font-bold ${eq.type === 'Owned' ? 'bg-navy/5 dark:bg-white/5 text-navy' : 'bg-orange/10 text-orange'}`}>{eq.type}</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${statusColor(eq.status)}`}>
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-navy truncate pr-16">{eq.name}</h4>
                    <p className="text-xs text-muted">{eq.category}{eq.serialNumber ? ` • ${eq.serialNumber}` : ''}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted text-xs">Status</span><br />
                    {viewMode === 'history' && eq.type === 'Rented' && eq.status !== 'Retired' ? (
                      <span className="badge text-xs font-semibold bg-danger/10 text-danger">Rental Expired</span>
                    ) : (
                      <span className={`badge text-xs font-semibold ${statusColor(eq.status)}`}>{eq.status}</span>
                    )}
                  </div>
                  <div><span className="text-muted text-xs">Condition</span><br /><span className={`font-semibold text-sm ${condColor(eq.condition)}`}>{eq.condition}</span></div>
                  <div><span className="text-muted text-xs">Project</span><br /><span className="font-medium text-navy text-xs">{eq.assignedProject?.name || 'Unassigned'}</span></div>
                  {eq.type === 'Rented' && (
                    <div><span className="text-muted text-xs">Daily Rate</span><br /><span className="font-mono font-bold text-orange text-sm">{formatCurrency(eq.dailyRate)}</span></div>
                  )}
                  {eq.type === 'Owned' && eq.purchaseCost > 0 && (
                    <div><span className="text-muted text-xs">Purchase Cost</span><br /><span className="font-mono font-bold text-navy text-sm">{formatCurrency(eq.purchaseCost)}</span></div>
                  )}
                </div>

                {eq.nextMaintenanceDate && (
                  <div className={`mt-3 flex items-center gap-1.5 text-xs ${new Date(eq.nextMaintenanceDate) <= new Date(Date.now() + 7 * 86400000) ? 'text-warning font-semibold' : 'text-muted'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    Next maintenance: {new Date(eq.nextMaintenanceDate).toLocaleDateString('en-IN')}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--color-glass-border)] flex items-center gap-1.5">
                  <button onClick={() => openAssign(eq)} title="Assign to Project" className="p-1.5 bg-black/50 hover:bg-orange/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-orange transition shadow-sm backdrop-blur">
                    <MapPin className="h-4 w-4" />
                  </button>
                  <button onClick={() => openServiceAdd(eq)} title="Add Service Log" className="p-1.5 bg-black/50 hover:bg-success/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-success transition shadow-sm backdrop-blur">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button onClick={() => openServiceHistory(eq)} title="Service History" className="p-1.5 bg-black/50 hover:bg-info/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-info transition shadow-sm backdrop-blur">
                    <History className="h-4 w-4" />
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => openEdit(eq)} title="Edit" className="p-1.5 bg-black/50 hover:bg-orange/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-orange transition shadow-sm backdrop-blur">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(eq)} title="Delete" className="p-1.5 bg-black/50 hover:bg-danger/20 border border-navy/10 dark:border-white/10 rounded-md text-navy/80 dark:text-white/80 hover:text-danger transition shadow-sm backdrop-blur">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Wrench className="h-12 w-12 mx-auto text-muted/30 mb-4" />
            <p className="text-lg font-semibold text-navy">No equipment found</p>
            <p className="text-sm text-muted mt-1">Add your first asset to start tracking</p>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-accent mt-6"><Plus className="h-4 w-4" /> Add Equipment</button>
          </div>
        )}
      </div>

      {/* ═══ ADD / EDIT EQUIPMENT MODAL ═══ */}
      {(showAddModal || showEditModal) && (
        <div className="modal-backdrop" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content max-w-lg p-0 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10"><Wrench className="h-5 w-5 text-orange" /></div>
                <h3 className="font-display text-lg font-bold text-navy">{showEditModal ? 'Edit Equipment' : 'Add Equipment'}</h3>
              </div>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="rounded-lg p-2 text-muted hover:bg-info"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={showEditModal ? handleEdit : handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="mb-1.5 block text-sm font-semibold text-navy">Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. JCB 3DX Backhoe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Category</label>
                  <CustomSelectMenu value={form.category} onChange={val => setForm({...form, category: val})} options={CATEGORIES.map(c => ({value: c, label: c}))} placeholder="Select Category" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Type</label>
                  <CustomSelectMenu value={form.type} onChange={val => setForm({...form, type: val})} options={[{value: 'Owned', label: 'Owned'}, {value: 'Rented', label: 'Rented'}]} placeholder="Select Type" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Serial Number</label>
                  <input type="text" className="input-field" placeholder="Optional" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Condition</label>
                  <CustomSelectMenu value={form.condition} onChange={val => setForm({...form, condition: val})} options={CONDITIONS.map(c => ({value: c, label: c}))} placeholder="Select Condition" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Status</label>
                  <CustomSelectMenu value={form.status} onChange={val => setForm({...form, status: val})} options={STATUSES.map(s => ({value: s, label: s}))} placeholder="Select Status" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Assign to Project</label>
                  <CustomSelectMenu value={form.assignedProject} onChange={val => setForm({...form, assignedProject: val})} options={[{value: '', label: 'Unassigned'}, ...safeProjects.map(p => ({value: p._id || p.id, label: p.name}))]} placeholder="Select Project" /></div>
              </div>

              {/* Dynamic fields based on type */}
              {form.type === 'Owned' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-glass-border)]">
                  <p className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider">Ownership Details</p>
                  <div><label className="mb-1.5 block text-sm font-semibold text-navy">Purchase Date</label>
                    <GlassDatePicker value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold text-navy">Purchase Cost (₹)</label>
                    <input type="number" min="0" className="input-field" value={form.purchaseCost} onChange={e => setForm({...form, purchaseCost: e.target.value})} /></div>
                </div>
              )}

              {form.type === 'Rented' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-glass-border)]">
                  <p className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider">Rental Details</p>
                  <div><label className="mb-1.5 block text-sm font-semibold text-navy">Daily Rate (₹) *</label>
                    <input type="number" min="0" className="input-field" value={form.dailyRate} onChange={e => setForm({...form, dailyRate: e.target.value})} /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold text-navy">Rental Vendor</label>
                    <input type="text" className="input-field" value={form.rentalVendor} onChange={e => setForm({...form, rentalVendor: e.target.value})} /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold text-navy">Start Date</label>
                    <GlassDatePicker value={form.rentalStartDate} onChange={e => setForm({...form, rentalStartDate: e.target.value})} /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold text-navy">End Date</label>
                    <GlassDatePicker value={form.rentalEndDate} onChange={e => setForm({...form, rentalEndDate: e.target.value})} /></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-glass-border)]">
                <p className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider">Maintenance</p>
                <div className="col-span-2"><label className="mb-1.5 block text-sm font-semibold text-navy">Next Maintenance Date</label>
                  <GlassDatePicker value={form.nextMaintenanceDate} onChange={e => setForm({...form, nextMaintenanceDate: e.target.value})} /></div>
              </div>

              <div><label className="mb-1.5 block text-sm font-semibold text-navy">Notes</label>
                <textarea className="input-field min-h-[60px] resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes..." /></div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">{submitting ? 'Saving...' : showEditModal ? 'Save Changes' : 'Add Equipment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ ASSIGN MODAL ═══ */}
      {showAssignModal && selectedEquipment && (
        <div className="modal-backdrop" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-navy mb-1">Assign to Project</h3>
            <p className="text-xs text-muted mb-5">Move <strong className="text-navy">{selectedEquipment.name}</strong> to a project site</p>
            <CustomSelectMenu 
              value={assignProject} 
              onChange={setAssignProject}
              options={[{value: '', label: 'Unassigned (Idle)'}, ...safeProjects.map(p => ({value: p._id || p.id, label: p.name}))]}
              placeholder="Select Project"
              className="mb-5"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAssign} disabled={submitting} className="btn-accent px-6">{submitting ? 'Assigning...' : 'Assign'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD SERVICE LOG MODAL ═══ */}
      {showServiceModal && selectedEquipment && (
        <div className="modal-backdrop" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content max-w-md p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
              <div><h3 className="font-display text-lg font-bold text-navy">Add Service Log</h3>
                <p className="text-xs text-muted">{selectedEquipment.name}</p></div>
              <button onClick={() => setShowServiceModal(false)} className="rounded-lg p-2 text-muted hover:bg-info"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleServiceAdd} className="p-6 space-y-4">
              <div><label className="mb-1.5 block text-sm font-semibold text-navy">Service Type *</label>
                <CustomSelectMenu 
                  value={serviceForm.type} 
                  onChange={val => setServiceForm({...serviceForm, type: val})}
                  options={['Routine Maintenance', 'Repair', 'Inspection', 'Breakdown'].map(t => ({value: t, label: t}))}
                  placeholder="Select Service Type"
                /></div>
              <div><label className="mb-1.5 block text-sm font-semibold text-navy">Description *</label>
                <textarea className="input-field min-h-[80px] resize-none" placeholder="What was done?" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Cost (₹)</label>
                  <input type="number" min="0" className="input-field" value={serviceForm.cost} onChange={e => setServiceForm({...serviceForm, cost: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Service Date</label>
                  <GlassDatePicker value={serviceForm.serviceDate} onChange={e => setServiceForm({...serviceForm, serviceDate: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Next Due Date</label>
                  <GlassDatePicker value={serviceForm.nextDueDate} onChange={e => setServiceForm({...serviceForm, nextDueDate: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Performed By</label>
                  <input type="text" className="input-field" placeholder="Technician name" value={serviceForm.performedBy} onChange={e => setServiceForm({...serviceForm, performedBy: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => setShowServiceModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">{submitting ? 'Saving...' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ SERVICE HISTORY PANEL ═══ */}
      {showServiceHistory && selectedEquipment && (
        <>
          <div className="fixed inset-0 z-[70] bg-navy/5 dark:bg-white/5 backdrop-blur-sm" onClick={() => setShowServiceHistory(false)} />
          <div className="fixed right-0 inset-y-0 z-[80] w-96 max-w-full bg-card border-l border-[var(--color-glass-border)] shadow-elevated overflow-y-auto animate-slideDown">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-[var(--color-glass-border)] px-5 py-4 flex items-center justify-between z-10">
              <div><h3 className="font-display text-lg font-bold text-navy">Service History</h3><p className="text-xs text-muted">{selectedEquipment.name}</p></div>
              <button onClick={() => setShowServiceHistory(false)} className="rounded-lg p-2 text-muted hover:bg-info"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {serviceLogs.length > 0 ? serviceLogs.map((log, i) => (
                <div key={log._id || i} className="rounded-xl border border-[var(--color-glass-border)] bg-info/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className={`badge text-xs font-bold ${log.type === 'Breakdown' ? 'bg-danger/10 text-danger' : log.type === 'Repair' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{log.type}</span>
                    <span className="text-xs text-muted">{new Date(log.serviceDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-navy mt-2 font-medium">{log.description}</p>
                  {log.cost > 0 && <p className="font-mono text-sm font-bold text-orange mt-1">{formatCurrency(log.cost)}</p>}
                  {log.performedBy && <p className="text-xs text-muted mt-1">By: {log.performedBy}</p>}
                  {log.nextDueDate && <p className="text-xs text-warning mt-1 font-semibold">Next due: {new Date(log.nextDueDate).toLocaleDateString('en-IN')}</p>}
                  <p className="text-[10px] text-muted mt-2">Added by {log.addedBy?.name || 'Unknown'}</p>
                </div>
              )) : (
                <div className="text-center py-12 text-muted">
                  <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No service records yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
