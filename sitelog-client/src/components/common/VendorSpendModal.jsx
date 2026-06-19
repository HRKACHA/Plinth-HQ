import { useState, useEffect } from 'react';
import { X, Truck, ChevronDown, IndianRupee, Calendar, Package, MapPin } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { vendorApi, projectApi, budgetApi, logApi } from '../../api/index';
import { formatCurrency } from '../../data/mockData';

import GlassDatePicker from './GlassDatePicker';
import CustomSelectMenu from './CustomSelectMenu';
export default function VendorSpendModal({ isOpen, onClose, onSuccess }) {
  const { data: vendors } = useAsync(() => vendorApi.list(), []);
  const { data: projects } = useAsync(() => projectApi.list(), []);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    projectId: '',
    projectName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    deliveryRent: '',
    materials: '',
  });

  const safeVendors = vendors || [];
  const safeProjects = projects || [];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        vendorId: '',
        vendorName: '',
        projectId: '',
        projectName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        deliveryRent: '',
        materials: '',
      });
      setStep(1);
    }
  }, [isOpen]);

  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    const vendor = safeVendors.find(v => (v._id || v.id) === vendorId);
    setFormData(prev => ({
      ...prev,
      vendorId,
      vendorName: vendor?.name || '',
    }));
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const project = safeProjects.find(p => (p._id || p.id) === projectId);
    setFormData(prev => ({
      ...prev,
      projectId,
      projectName: project?.name || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const totalAmount = Number(formData.amount) + (Number(formData.deliveryRent) || 0);
      const materialsArray = formData.materials.split(',').map(m => m.trim()).filter(Boolean);

      // 1. Create expense entry in project budget
      await budgetApi.createExpense(formData.projectId, {
        category: 'material',
        vendor: formData.vendorName,
        description: `Vendor Spend — ${materialsArray.join(', ')}${formData.deliveryRent ? ` (incl. ₹${formData.deliveryRent} delivery)` : ''}`,
        amount: totalAmount,
        invoiceDate: formData.date,
      });

      // 2. Create material entries in the project logs
      const existingLogs = await logApi.list(formData.projectId);
      const existingLog = existingLogs?.find(l => l.date?.substring(0, 10) === formData.date);

      const newMaterials = materialsArray.map(name => ({
        name,
        qty: '1',
        unit: 'lot',
        supplier: formData.vendorName,
        price: Math.round(Number(formData.amount) / materialsArray.length),
        recdAt: formData.date,
      }));

      if (existingLog) {
        await logApi.update(formData.projectId, existingLog._id, {
          materials: [...(existingLog.materials || []), ...newMaterials],
        });
      } else {
        await logApi.create(formData.projectId, {
          date: formData.date,
          weather: 'sunny',
          activities: `Vendor Delivery: ${formData.vendorName} — ${materialsArray.join(', ')}`,
          materials: newMaterials,
        });
      }

      // 3. Update vendor totalSpend
      const vendor = safeVendors.find(v => (v._id || v.id) === formData.vendorId);
      if (vendor) {
        await vendorApi.update(vendor._id || vendor.id, {
          totalSpend: (vendor.totalSpend || 0) + totalAmount,
        });
      }

      setStep(2);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save vendor spend');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg p-0" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10">
              <Truck className="h-5 w-5 text-orange" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-navy tracking-tight">Add Vendor Spend</h3>
              <p className="text-xs text-muted">Record a spend and auto-update project dashboards</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-info hover:text-navy transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Vendor Select */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                <Truck className="inline h-3.5 w-3.5 mr-1.5 text-muted" />Vendor *
              </label>
              <CustomSelectMenu
                value={formData.vendorId}
                onChange={(val) => handleVendorChange({ target: { value: val } })}
                options={[{value: '', label: 'Select a vendor...'}, ...safeVendors.map(v => ({value: v._id || v.id, label: `${v.name} (${v.category})`}))]}
                placeholder="Select a vendor..."
              />
            </div>

            {/* Project Select */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                <MapPin className="inline h-3.5 w-3.5 mr-1.5 text-muted" />Project *
              </label>
              <CustomSelectMenu
                value={formData.projectId}
                onChange={(val) => handleProjectChange({ target: { value: val } })}
                options={[{value: '', label: 'Select a project...'}, ...safeProjects.map(p => ({value: p._id || p.id, label: p.name}))]}
                placeholder="Select a project..."
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">
                  <IndianRupee className="inline h-3.5 w-3.5 mr-1.5 text-muted" />Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 50000"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">
                  <Calendar className="inline h-3.5 w-3.5 mr-1.5 text-muted" />Date *
                </label>
                <GlassDatePicker value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Delivery Rent */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                Delivery / Rent (₹) <span className="text-muted font-normal">— optional</span>
              </label>
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="e.g. 2000"
                value={formData.deliveryRent}
                onChange={e => setFormData({ ...formData, deliveryRent: e.target.value })}
              />
            </div>

            {/* Materials Ordered */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                <Package className="inline h-3.5 w-3.5 mr-1.5 text-muted" />Materials Ordered *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cement, Steel Bars, Sand"
                value={formData.materials}
                onChange={e => setFormData({ ...formData, materials: e.target.value })}
                required
              />
              <p className="mt-1 text-[11px] text-muted">Separate multiple items with commas</p>
            </div>

            {/* Summary */}
            {formData.amount && formData.vendorName && (
              <div className="rounded-xl bg-info/50 border border-[var(--color-glass-border)] p-3 text-sm">
                <p className="font-semibold text-navy">Spend Summary</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-muted">
                  <span>Vendor:</span>
                  <span className="text-navy font-medium">{formData.vendorName}</span>
                  <span>Project:</span>
                  <span className="text-navy font-medium">{formData.projectName || '—'}</span>
                  <span>Material Cost:</span>
                  <span className="font-mono text-navy font-semibold">{formatCurrency(Number(formData.amount) || 0)}</span>
                  {formData.deliveryRent && <>
                    <span>Delivery/Rent:</span>
                    <span className="font-mono text-navy">{formatCurrency(Number(formData.deliveryRent) || 0)}</span>
                  </>}
                  <span className="font-semibold text-navy border-t border-[var(--color-glass-border)] pt-1 mt-1">Total:</span>
                  <span className="font-mono font-bold text-orange border-t border-[var(--color-glass-border)] pt-1 mt-1">
                    {formatCurrency((Number(formData.amount) || 0) + (Number(formData.deliveryRent) || 0))}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-accent px-8">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : 'Save Spend'}
              </button>
            </div>
          </form>
        ) : (
          /* Success Step */
          <div className="p-8 text-center animate-scaleIn">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">Spend Recorded!</h3>
            <p className="text-sm text-muted max-w-xs mx-auto">
              The vendor spend has been added to <strong className="text-navy">{formData.projectName}</strong>'s Materials and Expenses dashboards.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={onClose} className="btn-secondary">Close</button>
              <button onClick={() => setStep(1)} className="btn-accent">Add Another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
