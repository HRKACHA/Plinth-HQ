import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Plus, X } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { logApi, budgetApi } from '../../api/index';

import DateAccordion from '../../components/common/DateAccordion';

import GlassDatePicker from '../../components/common/GlassDatePicker';
import CustomSelectMenu from '../../components/common/CustomSelectMenu';

const UNITS = ['bags', 'kg', 'ton', 'pieces', 'sqft', 'litres', 'cu.m', 'bundle', 'Other'];
export default function Materials() {
  const { id } = useParams();
  const { data: logs = [], loading } = useAsync(() => logApi.list(id), [id]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], name: '', qty: '', unit: 'bags', customUnit: '', supplier: '', price: '' });

  const submitMaterial = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const existingLog = logs.find(l => l.date.substring(0, 10) === formData.date);
      const newMat = { name: formData.name, qty: formData.qty, unit: formData.unit === 'Other' ? formData.customUnit : formData.unit, supplier: formData.supplier, price: Number(formData.price), recdAt: formData.date };
      
      if (existingLog) {
        await logApi.update(id, existingLog._id, {
          materials: [...(existingLog.materials || []), newMat]
        });
      } else {
        await logApi.create(id, {
          date: formData.date,
          weather: 'sunny',
          activities: `Material Delivery: ${formData.name}`,
          materials: [newMat]
        });
      }

      if (Number(formData.price) > 0) {
        await budgetApi.createExpense(id, {
          category: 'material',
          vendor: formData.supplier || 'Various Suppliers',
          description: `Material Cost (${formData.date}) — ${formData.name}`,
          amount: Number(formData.price),
          invoiceDate: formData.date
        });
      }
      window.location.reload();
    } catch (err) {
      alert('Failed to save material');
      setSubmitting(false);
    }
  };

  const allMaterials = logs.flatMap((log) =>
    (log.materials || []).map((m) => ({ ...m, date: log.date.substring(0, 10) }))
  );

  // Group by date
  const groupedMaterials = allMaterials.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedMaterials).sort((a, b) => new Date(b) - new Date(a));

  if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  return (
    <div>
      <div className="mb-6 flex justify-between">
        <h3 className="font-bold text-navy">Material Entries</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-accent"><Plus className="h-4 w-4" /> Material Entry</button>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-lg w-full p-0 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-glass-border)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10"><Package className="h-5 w-5 text-orange" /></div>
                <div><h3 className="font-display text-lg font-bold text-navy">Add Material</h3><p className="text-xs text-muted">Log material delivery</p></div>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-muted hover:bg-info hover:text-navy transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitMaterial} className="p-6 grid gap-4 sm:grid-cols-2 items-start">
              <div className="sm:col-span-1">
                <label className="mb-1 text-xs font-semibold text-navy">Date</label>
                <GlassDatePicker required  value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 text-xs font-semibold text-navy">Item Name</label>
                <input placeholder="e.g. Cement" required className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 text-xs font-semibold text-navy">Quantity</label>
                <input placeholder="e.g. 50" required className="input-field" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 text-xs font-semibold text-navy">Unit</label>
                <CustomSelectMenu value={formData.unit} onChange={(val) => setFormData({ ...formData, unit: val })} options={UNITS.map(u => ({value: u, label: u}))} placeholder="Unit" />
                {formData.unit === 'Other' && (
                  <input placeholder="Specify..." required className="input-field mt-2" value={formData.customUnit} onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })} />
                )}
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 text-xs font-semibold text-navy">Supplier</label>
                <input placeholder="Supplier" className="input-field" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 text-xs font-semibold text-navy">Price (₹)</label>
                <input placeholder="Price" required type="number" min="0" className="input-field" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-4 mt-2 border-t border-[var(--color-glass-border)]">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">{submitting ? 'Saving...' : 'Save Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sortedDates.length === 0 ? (
        <div className="card py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted/40" />
          <p className="mt-4 font-semibold text-navy">No materials logged yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date, index) => {
            const dayMaterials = groupedMaterials[date];
            const dayTotal = dayMaterials.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
            
            return (
              <DateAccordion 
                key={date} 
                date={date} 
                defaultOpen={index === 0}
                summary={`${dayMaterials.length} items logged • Total: ₹${dayTotal.toLocaleString('en-IN')}`}
              >
                <div className="overflow-x-auto rounded-xl border border-navy/10 bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy/10 bg-info/50 text-left text-xs uppercase text-muted">
                        <th className="px-5 py-3 whitespace-nowrap">Item</th>
                        <th className="px-5 py-3 whitespace-nowrap">Qty</th>
                        <th className="px-5 py-3 whitespace-nowrap">Supplier</th>
                        <th className="px-5 py-3 whitespace-nowrap text-right">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayMaterials.map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-info/20'}>
                          <td className="px-5 py-3 font-medium whitespace-nowrap">{item.name}</td>
                          <td className="px-5 py-3 font-mono whitespace-nowrap">{item.qty} {item.unit}</td>
                          <td className="px-5 py-3 text-muted whitespace-nowrap">{item.supplier}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold whitespace-nowrap">
                            {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DateAccordion>
            );
          })}
        </div>
      )}
    </div>
  );
}
