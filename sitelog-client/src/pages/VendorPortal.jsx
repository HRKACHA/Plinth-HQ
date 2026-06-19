import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Truck, Search, Phone, Mail, X, Pencil, Trash2, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import { useAsync } from '../hooks/useAsync';
import { vendorApi } from '../api/index';
import VendorSpendModal from '../components/common/VendorSpendModal';
import CustomSelectMenu from '../components/common/CustomSelectMenu';

export default function VendorPortal() {
  const { data: vendors, loading, refresh } = useAsync(() => vendorApi.list(), []);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '', category: 'Materials', contact: '', email: '', pendingOrders: 0, totalSpend: 0
  });

  const safeVendors = vendors || [];
  const filteredVendors = safeVendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => {
    setVendorForm({ name: '', category: 'Materials', contact: '', email: '', pendingOrders: 0, totalSpend: 0 });
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vendorApi.create({
        name: vendorForm.name,
        category: vendorForm.category,
        contact: vendorForm.contact,
        email: vendorForm.email,
      });
      setShowAddModal(false);
      resetForm();
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (v) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      category: v.category,
      contact: v.contact || '',
      email: v.email || '',
      pendingOrders: v.pendingOrders || 0,
      totalSpend: v.totalSpend || 0,
    });
    setShowEditModal(true);
  };

  const handleEditVendor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vendorApi.update(editingVendor._id, {
        name: vendorForm.name,
        category: vendorForm.category,
        contact: vendorForm.contact,
        email: vendorForm.email,
        pendingOrders: Number(vendorForm.pendingOrders),
        totalSpend: Number(vendorForm.totalSpend),
      });
      setShowEditModal(false);
      setEditingVendor(null);
      resetForm();
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (v) => {
    if (!confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return;
    try {
      await vendorApi.delete(v._id);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vendor');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Vendor Portal">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Vendor Portal">
      <div className="animate-fadeIn">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowSpendModal(true)} className="btn-secondary">
              <IndianRupee className="h-4 w-4" /> Add Vendor Spend
            </button>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-accent">Add Vendor</button>
          </div>
        </div>

        {filteredVendors && filteredVendors.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVendors.map(v => (
              <div key={v._id} className="card hover:-translate-y-1 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/10 text-orange-dark">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-info text-navy">{v.category}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-muted hover:bg-orange/10 hover:text-orange transition" title="Edit vendor">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteVendor(v)} className="p-1.5 rounded-lg text-muted hover:bg-danger/10 hover:text-danger transition" title="Delete vendor">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-navy">{v.name}</h3>
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {v.contact || 'No contact'}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {v.email || 'No email'}</div>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--color-glass-border)] flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">Total Spend</p>
                    <p className="font-semibold text-navy">{formatCurrency(v.totalSpend || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Pending Orders</p>
                    <p className="font-semibold text-orange">{v.pendingOrders || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-glass-border)] bg-card p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Truck className="h-8 w-8 text-muted/40" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">No vendors found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">Manage your suppliers, contractors, and equipment rentals all in one place.</p>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-accent mt-6">Add First Vendor</button>
          </div>
        )}

        {/* Add Vendor Modal */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-lg p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-navy">Add New Vendor</h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-navy"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAddVendor} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Vendor Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. UltraTech Cement" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Category *</label>
                    <CustomSelectMenu 
                      value={vendorForm.category} 
                      onChange={val => setVendorForm({...vendorForm, category: val})} 
                      options={['Materials', 'Labour', 'Equipment', 'Other'].map(c => ({value: c, label: c}))} 
                      placeholder="Select Category" 
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Contact Number</label>
                    <input type="tel" className="input-field" placeholder="+91 98765 43210" value={vendorForm.contact} onChange={e => setVendorForm({...vendorForm, contact: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Email Address</label>
                  <input type="email" className="input-field" placeholder="contact@vendor.com" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} />
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Adding...' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Vendor Modal */}
        {showEditModal && editingVendor && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-lg p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-navy">Edit Vendor</h3>
                <button onClick={() => { setShowEditModal(false); setEditingVendor(null); }} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-navy"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleEditVendor} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Vendor Name *</label>
                  <input type="text" className="input-field" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Category *</label>
                    <CustomSelectMenu 
                      value={vendorForm.category} 
                      onChange={val => setVendorForm({...vendorForm, category: val})} 
                      options={['Materials', 'Labour', 'Equipment', 'Other'].map(c => ({value: c, label: c}))} 
                      placeholder="Select Category" 
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Contact Number</label>
                    <input type="tel" className="input-field" value={vendorForm.contact} onChange={e => setVendorForm({...vendorForm, contact: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Email Address</label>
                  <input type="email" className="input-field" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Total Spend (₹)</label>
                    <input type="number" className="input-field" min="0" value={vendorForm.totalSpend} onChange={e => setVendorForm({...vendorForm, totalSpend: e.target.value})} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Pending Orders</label>
                    <input type="number" className="input-field" min="0" value={vendorForm.pendingOrders} onChange={e => setVendorForm({...vendorForm, pendingOrders: e.target.value})} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingVendor(null); }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-accent">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Spend Modal */}
      <VendorSpendModal
        isOpen={showSpendModal}
        onClose={() => setShowSpendModal(false)}
        onSuccess={() => refresh()}
      />
    </AppLayout>
  );
}
