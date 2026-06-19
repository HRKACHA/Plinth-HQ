import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import {
  Package, Search, Plus, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft,
  AlertTriangle, Pencil, Trash2, X, ChevronDown, History, IndianRupee, Warehouse
} from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import { useAsync } from '../hooks/useAsync';
import { materialApi, projectApi } from '../api/index';

import GlassDatePicker from '../components/common/GlassDatePicker';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
const CATEGORIES = ['Cement', 'Steel', 'Sand', 'Aggregate', 'Brick', 'Timber', 'Paint', 'Electrical', 'Plumbing', 'Other'];
const UNITS = ['bags', 'kg', 'ton', 'pieces', 'sqft', 'litres', 'cu.m', 'bundle', 'Other'];

export default function MaterialsPortal() {
  const { data: materials, loading, refresh } = useAsync(() => materialApi.list(), []);
  const { data: lowStock } = useAsync(() => materialApi.lowStock(), []);
  const { data: projects } = useAsync(() => projectApi.list(), []);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [movementLogs, setMovementLogs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'Cement', unit: 'bags', currentStock: '', minThreshold: '',
    unitPrice: '', supplier: '', location: 'Central Warehouse', project: '',
  });
  const [moveForm, setMoveForm] = useState({
    type: 'inward', qty: '', vendor: '', notes: '', date: new Date().toISOString().split('T')[0],
    fromProject: '', toProject: '',
  });

  const safeMaterials = materials || [];
  const safeLowStock = lowStock || [];
  const safeProjects = projects || [];

  const filtered = safeMaterials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || m.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalValue = safeMaterials.reduce((sum, m) => sum + (m.currentStock * m.unitPrice), 0);

  const resetForm = () => setForm({
    name: '', category: 'Cement', unit: 'bags', currentStock: '', minThreshold: '',
    unitPrice: '', supplier: '', location: 'Central Warehouse', project: '',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await materialApi.create(form);
      setShowAddModal(false);
      resetForm();
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add material');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await materialApi.update(selectedMaterial._id || selectedMaterial.id, form);
      setShowEditModal(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (mat) => {
    if (!confirm(`Delete "${mat.name}"? This will remove all movement history.`)) return;
    try {
      await materialApi.delete(mat._id || mat.id);
      refresh();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const openEdit = (mat) => {
    setSelectedMaterial(mat);
    setForm({
      name: mat.name, category: mat.category, unit: mat.unit,
      currentStock: mat.currentStock, minThreshold: mat.minThreshold,
      unitPrice: mat.unitPrice, supplier: mat.supplier || '',
      location: mat.location || '', project: mat.project?._id || mat.project || '',
    });
    setShowEditModal(true);
  };

  const openMove = (mat) => {
    setSelectedMaterial(mat);
    setMoveForm({ type: 'inward', qty: '', vendor: '', notes: '', date: new Date().toISOString().split('T')[0], fromProject: '', toProject: '' });
    setShowMoveModal(true);
  };

  const handleMove = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await materialApi.addMovement(selectedMaterial._id || selectedMaterial.id, moveForm);
      setShowMoveModal(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (mat) => {
    setSelectedMaterial(mat);
    setShowHistoryPanel(true);
    try {
      const logs = await materialApi.listMovements(mat._id || mat.id);
      setMovementLogs(logs);
    } catch { setMovementLogs([]); }
  };

  const getStockStatus = (m) => {
    if (m.currentStock <= 0) return { label: 'Out of Stock', color: 'bg-danger/10 text-danger' };
    if (m.minThreshold > 0 && m.currentStock <= m.minThreshold) return { label: 'Low Stock', color: 'bg-warning/10 text-warning' };
    return { label: 'In Stock', color: 'bg-success/10 text-success' };
  };

  return (
    <AppLayout title="Materials — Inventory & Stock Management">
      <div className="space-y-6">
        {/* Low Stock Alert */}
        {safeLowStock.length > 0 && (
          <div className="rounded-2xl bg-warning/5 border border-warning/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-navy">Low Stock Alert</p>
              <p className="text-sm text-muted mt-1">
                {safeLowStock.length} item{safeLowStock.length > 1 ? 's are' : ' is'} below minimum threshold:{' '}
                <span className="font-semibold text-navy">{safeLowStock.map(m => m.name).join(', ')}</span>
              </p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Items', value: safeMaterials.length, icon: Package, accent: 'text-orange bg-orange/10' },
            { label: 'Total Stock Value', value: formatCurrency(totalValue), icon: IndianRupee, accent: 'text-success bg-success/10' },
            { label: 'Low Stock Alerts', value: safeLowStock.length, icon: AlertTriangle, accent: safeLowStock.length > 0 ? 'text-warning bg-warning/10' : 'text-muted bg-info' },
            { label: 'Categories Used', value: [...new Set(safeMaterials.map(m => m.category))].length, icon: Warehouse, accent: 'text-navy bg-info' },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
                <p className="font-mono text-xl font-bold text-navy mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter + Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type="text" placeholder="Search materials or suppliers..." value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10" />
          </div>
          <CustomSelectMenu
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[{value: '', label: 'All Categories'}, ...CATEGORIES.map(c => ({value: c, label: c}))]}
            placeholder="All Categories"
            className="w-auto min-w-[140px]"
          />
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-accent shrink-0">
            <Plus className="h-4 w-4" /> Add Material
          </button>
        </div>

        {/* Materials Table */}
        {loading ? (
          <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" /></div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-glass-border)] bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-glass-border)] bg-info/30">
                  <th className="px-4 py-3 text-left font-semibold text-navy">Material</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Category</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Unit</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">Price/Unit</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Supplier</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Location</th>
                  <th className="px-4 py-3 text-center font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const status = getStockStatus(m);
                  return (
                    <tr key={m._id || m.id} className="border-b border-[var(--color-glass-border)] last:border-0 hover:bg-info/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-navy">{m.name}</td>
                      <td className="px-4 py-3"><span className="badge bg-info text-navy text-xs">{m.category}</span></td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-navy">
                        {m.currentStock}
                        {m.minThreshold > 0 && <span className="text-muted font-normal text-[10px] ml-1">/ min {m.minThreshold}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted">{m.unit}</td>
                      <td className="px-4 py-3 text-right font-mono text-navy">{formatCurrency(m.unitPrice)}</td>
                      <td className="px-4 py-3"><span className={`badge text-xs font-semibold ${status.color}`}>{status.label}</span></td>
                      <td className="px-4 py-3 text-muted truncate max-w-[120px]">{m.supplier || '—'}</td>
                      <td className="px-4 py-3 text-muted truncate max-w-[120px]">{m.location || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openMove(m)} title="Stock Movement" className="rounded-lg p-1.5 text-success hover:bg-success/10 transition-colors">
                            <ArrowDownToLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => openHistory(m)} title="View History" className="rounded-lg p-1.5 text-muted hover:bg-info transition-colors">
                            <History className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(m)} title="Edit" className="rounded-lg p-1.5 text-muted hover:bg-info hover:text-navy transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(m)} title="Delete" className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted/30 mb-4" />
            <p className="text-lg font-semibold text-navy">No materials found</p>
            <p className="text-sm text-muted mt-1">Add your first inventory item to start tracking stock</p>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-accent mt-6"><Plus className="h-4 w-4" /> Add Material</button>
          </div>
        )}
      </div>

      {/* ═══ ADD MATERIAL MODAL ═══ */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-lg p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10"><Package className="h-5 w-5 text-orange" /></div>
                <div><h3 className="font-display text-lg font-bold text-navy">Add Material</h3><p className="text-xs text-muted">New inventory item</p></div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-2 text-muted hover:bg-info hover:text-navy transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. Ultratech Cement 50kg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Category</label>
                  <CustomSelectMenu value={form.category} onChange={val => setForm({...form, category: val})} options={CATEGORIES.map(c => ({value: c, label: c}))} placeholder="Select Category" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Unit</label>
                  <CustomSelectMenu value={form.unit} onChange={val => setForm({...form, unit: val})} options={UNITS.map(u => ({value: u, label: u}))} placeholder="Select Unit" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Initial Stock</label>
                  <input type="number" min="0" className="input-field" placeholder="0" value={form.currentStock} onChange={e => setForm({...form, currentStock: e.target.value})} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Min Threshold</label>
                  <input type="number" min="0" className="input-field" placeholder="e.g. 10" value={form.minThreshold} onChange={e => setForm({...form, minThreshold: e.target.value})} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Price per Unit (₹)</label>
                  <input type="number" min="0" className="input-field" placeholder="e.g. 400" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Supplier</label>
                  <input type="text" className="input-field" placeholder="e.g. ACC Limited" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Location</label>
                  <input type="text" className="input-field" placeholder="Central Warehouse" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Assign to Project</label>
                  <CustomSelectMenu value={form.project} onChange={val => setForm({...form, project: val})} options={[{value: '', label: 'Central Warehouse'}, ...safeProjects.map(p => ({value: p._id || p.id, label: p.name}))]} placeholder="Select Project" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">
                  {submitting ? 'Adding...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT MATERIAL MODAL ═══ */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-lg p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
              <h3 className="font-display text-lg font-bold text-navy">Edit Material</h3>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-2 text-muted hover:bg-info"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="mb-1.5 block text-sm font-semibold text-navy">Name *</label>
                  <input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Category</label>
                  <CustomSelectMenu value={form.category} onChange={val => setForm({...form, category: val})} options={CATEGORIES.map(c => ({value: c, label: c}))} placeholder="Select Category" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Unit</label>
                  <CustomSelectMenu value={form.unit} onChange={val => setForm({...form, unit: val})} options={UNITS.map(u => ({value: u, label: u}))} placeholder="Select Unit" /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Min Threshold</label>
                  <input type="number" min="0" className="input-field" value={form.minThreshold} onChange={e => setForm({...form, minThreshold: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Price/Unit (₹)</label>
                  <input type="number" min="0" className="input-field" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Supplier</label>
                  <input type="text" className="input-field" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Location</label>
                  <input type="text" className="input-field" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ STOCK MOVEMENT MODAL ═══ */}
      {showMoveModal && selectedMaterial && (
        <div className="modal-backdrop" onClick={() => setShowMoveModal(false)}>
          <div className="modal-content max-w-md p-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
              <div>
                <h3 className="font-display text-lg font-bold text-navy">Stock Movement</h3>
                <p className="text-xs text-muted">{selectedMaterial.name} — Current: <strong className="text-navy">{selectedMaterial.currentStock} {selectedMaterial.unit}</strong></p>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="rounded-lg p-2 text-muted hover:bg-info"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleMove} className="p-6 space-y-4">
              <div className="flex gap-2">
                {[
                  { val: 'inward', label: 'Inward', icon: ArrowDownToLine, color: 'text-success' },
                  { val: 'outward', label: 'Outward', icon: ArrowUpFromLine, color: 'text-danger' },
                  { val: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-orange' },
                ].map(({ val, label, icon: Icon, color }) => (
                  <button key={val} type="button" onClick={() => setMoveForm({...moveForm, type: val})}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${moveForm.type === val ? `border-orange bg-orange/5 ${color}` : 'border-[var(--color-glass-border)] text-muted hover:bg-info'}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Quantity *</label>
                  <input type="number" min="0.01" step="0.01" className="input-field" placeholder="e.g. 50" value={moveForm.qty} onChange={e => setMoveForm({...moveForm, qty: e.target.value})} required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Date</label>
                  <GlassDatePicker value={moveForm.date} onChange={e => setMoveForm({...moveForm, date: e.target.value})} /></div>
              </div>
              {moveForm.type === 'inward' && (
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Vendor / Source</label>
                  <input type="text" className="input-field" placeholder="e.g. ACC Limited" value={moveForm.vendor} onChange={e => setMoveForm({...moveForm, vendor: e.target.value})} /></div>
              )}
              {moveForm.type === 'transfer' && (
                <div><label className="mb-1.5 block text-sm font-semibold text-navy">Transfer to Project</label>
                  <CustomSelectMenu value={moveForm.toProject} onChange={val => setMoveForm({...moveForm, toProject: val})} options={[{value: '', label: 'Select project...'}, ...safeProjects.map(p => ({value: p._id || p.id, label: p.name}))]} placeholder="Select project..." /></div>
              )}
              <div><label className="mb-1.5 block text-sm font-semibold text-navy">Notes</label>
                <input type="text" className="input-field" placeholder="Optional notes..." value={moveForm.notes} onChange={e => setMoveForm({...moveForm, notes: e.target.value})} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => setShowMoveModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">{submitting ? 'Recording...' : 'Record Movement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MOVEMENT HISTORY PANEL ═══ */}
      {showHistoryPanel && selectedMaterial && (
        <>
          <div className="fixed inset-0 z-[70] bg-white/5 backdrop-blur-sm" onClick={() => setShowHistoryPanel(false)} />
          <div className="fixed right-0 inset-y-0 z-[80] w-96 max-w-full bg-card border-l border-[var(--color-glass-border)] shadow-elevated overflow-y-auto animate-slideDown">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-[var(--color-glass-border)] px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-display text-lg font-bold text-navy">Movement History</h3>
                <p className="text-xs text-muted">{selectedMaterial.name}</p>
              </div>
              <button onClick={() => setShowHistoryPanel(false)} className="rounded-lg p-2 text-muted hover:bg-info"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {movementLogs.length > 0 ? movementLogs.map((log, i) => (
                <div key={log._id || i} className="rounded-xl border border-[var(--color-glass-border)] bg-info/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className={`badge text-xs font-bold ${log.type === 'inward' ? 'bg-success/10 text-success' : log.type === 'outward' ? 'bg-danger/10 text-danger' : 'bg-orange/10 text-orange'}`}>
                      {log.type === 'inward' ? '↓ Inward' : log.type === 'outward' ? '↑ Outward' : '↔ Transfer'}
                    </span>
                    <span className="text-xs text-muted">{new Date(log.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="font-mono text-lg font-bold text-navy mt-2">{log.qty} {selectedMaterial.unit}</p>
                  {log.vendor && <p className="text-xs text-muted mt-1">Vendor: <span className="text-navy">{log.vendor}</span></p>}
                  {log.toProject?.name && <p className="text-xs text-muted mt-1">To: <span className="text-navy">{log.toProject.name}</span></p>}
                  {log.notes && <p className="text-xs text-muted mt-1 italic">{log.notes}</p>}
                  <p className="text-[10px] text-muted mt-2">By {log.addedBy?.name || 'Unknown'}</p>
                </div>
              )) : (
                <div className="text-center py-12 text-muted">
                  <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No movement history yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
