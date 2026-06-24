import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Receipt, Plus, FileImage, X } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { budgetApi, uploadApi } from '../../api/index';

import DateAccordion from '../../components/common/DateAccordion';

import GlassDatePicker from '../../components/common/GlassDatePicker';
import CustomSelectMenu from '../../components/common/CustomSelectMenu';
export default function Expenses() {
  const { id } = useParams();
  const { data, loading, reload } = useAsync(() => budgetApi.get(id), [id]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ category: 'material', customCategory: '', vendor: '', description: '', amount: '', invoiceDate: new Date().toISOString().split('T')[0], receiptUrl: '' });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSubmitting(true);
      const res = await uploadApi.file(file);
      setFormData(prev => ({ ...prev, receiptUrl: res.url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const submitData = { ...formData, category: formData.category === 'other' ? formData.customCategory : formData.category, amount: Number(formData.amount) };
      await budgetApi.createExpense(id, submitData);
      setShowModal(false);
      setFormData({ category: 'material', customCategory: '', vendor: '', description: '', amount: '', invoiceDate: new Date().toISOString().split('T')[0], receiptUrl: '' });
      reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  const expenses = data?.expenses || [];

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, e) => {
    // Convert UTC to local YYYY-MM-DD
    const dateObj = new Date(e.invoiceDate);
    const date = dateObj.toLocaleDateString('en-CA'); // en-CA format is YYYY-MM-DD
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div>
      <div className="mb-6 flex justify-between">
        <h3 className="font-bold text-navy">Expense Entry & Invoices</h3>
        <button onClick={() => setShowModal(true)} className="btn-accent"><Plus className="h-4 w-4" /> Add Expense</button>
      </div>
      
      {sortedDates.length === 0 ? (
        <div className="card py-16 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted/40" />
          <p className="mt-4 font-semibold text-navy">No expenses logged yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date, index) => {
            const dayExpenses = groupedExpenses[date];
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

            return (
              <DateAccordion 
                key={date} 
                date={date} 
                defaultOpen={index === 0}
                summary={`${dayExpenses.length} expenses • Total: ${formatCurrency(dayTotal)}`}
              >
                <div className="overflow-x-auto rounded-xl border border-navy/10 bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy/10 bg-info/50 text-left text-xs uppercase text-muted">
                        <th className="px-5 py-3 whitespace-nowrap">Vendor</th>
                        <th className="px-5 py-3 whitespace-nowrap">Category</th>
                        <th className="px-5 py-3 whitespace-nowrap">Description</th>
                        <th className="px-5 py-3 whitespace-nowrap text-right">Amount (₹)</th>
                        <th className="px-5 py-3 whitespace-nowrap text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayExpenses.map((e, i) => (
                        <tr key={e._id} className={i % 2 === 0 ? 'bg-card' : 'bg-info/20'}>
                          <td className="px-5 py-3 font-medium whitespace-nowrap">{e.vendor}</td>
                          <td className="px-5 py-3 whitespace-nowrap"><Badge status={e.category} /></td>
                          <td className="px-5 py-3 text-muted min-w-[200px]">{e.description}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold whitespace-nowrap">{formatCurrency(e.amount)}</td>
                          <td className="px-5 py-3 text-center">
                            {e.receiptUrl ? (
                              <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="inline-block text-orange hover:text-orange-dark">
                                <FileImage className="h-5 w-5" />
                              </a>
                            ) : (
                              <span className="inline-block text-muted/30"><FileImage className="h-5 w-5" /></span>
                            )}
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

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between border-b border-navy/5 pb-4">
              <h3 className="text-xl font-bold text-navy">Add Expense</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-muted hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Category *</label>
                  <CustomSelectMenu 
                    value={formData.category} 
                    onChange={val => setFormData({ ...formData, category: val })}
                    options={[
                      {value: 'material', label: 'Material'},
                      {value: 'labour', label: 'Labour'},
                      {value: 'equipment', label: 'Equipment'},
                      {value: 'overhead', label: 'Overhead'},
                      {value: 'other', label: 'Other'}
                    ]}
                    placeholder="Select Category"
                  />
                  {formData.category === 'other' && (
                    <input type="text" placeholder="Specify category..." value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} className="input-field mt-2" required />
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Amount (₹) *</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" required min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Vendor *</label>
                  <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="input-field" required maxLength="100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Invoice Date *</label>
                  <GlassDatePicker value={formData.invoiceDate} onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" maxLength="300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Receipt</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={submitting} className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-orange/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-orange-dark hover:file:bg-orange/20 cursor-pointer" />
                  {formData.receiptUrl && <span className="text-xs font-bold text-success">Uploaded</span>}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-navy/10">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
