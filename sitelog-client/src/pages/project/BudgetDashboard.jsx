import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Receipt } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { budgetApi } from '../../api/index';
import DateAccordion from '../../components/common/DateAccordion';
const COLORS = ['#4285F4', '#6AADFF', '#4AC88C', '#E6B43C', '#8B8D94'];

export default function BudgetDashboard() {
  const { id } = useParams();
  const { data, loading } = useAsync(() => budgetApi.get(id), [id]);

  if (loading || !data) {
    return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;
  }

  const doughnutData = (data.categories || []).map((c) => ({ name: c.name, value: c.allocated }));

  // Group expenses by date
  const expenses = data.expenses || [];
  const groupedExpenses = expenses.reduce((acc, e) => {
    const dateObj = new Date(e.invoiceDate);
    const date = dateObj.toLocaleDateString('en-CA');
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pdfCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(22, 24, 30);
    doc.text('Project Budget Report', 14, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(139, 141, 148);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

    // Summary Section Box
    doc.setDrawColor(235, 237, 245);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 36, 182, 32, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 24, 30);
    doc.text('Budget Summary', 20, 44);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 105, 115);
    doc.text('Total Budget:', 20, 53);
    doc.text('Total Spent:', 20, 61);
    
    doc.text('Remaining:', 110, 53);
    doc.text('Burn Rate:', 110, 61);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 24, 30);
    doc.text(pdfCurrency(data.totalBudget), 45, 53);
    doc.setTextColor(220, 53, 69); // Red-ish for spent
    doc.text(pdfCurrency(data.spent), 45, 61);
    doc.setTextColor(40, 167, 69); // Green for remaining
    doc.text(pdfCurrency(data.remaining), 132, 53);
    doc.setTextColor(22, 24, 30);
    doc.text(`${data.burnRate}%`, 132, 61);

    // Expenses Table
    if (data.expenses && data.expenses.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(22, 24, 30);
      doc.text('Expense History', 14, 82);

      const tableData = data.expenses.map(e => [
        new Date(e.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        e.category.charAt(0).toUpperCase() + e.category.slice(1),
        e.vendor,
        e.description,
        pdfCurrency(e.amount)
      ]);

      autoTable(doc, {
        startY: 88,
        head: [['Date', 'Category', 'Vendor', 'Description', 'Amount']],
        body: tableData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [235, 237, 245] },
        headStyles: { fillColor: [66, 133, 244], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 }
        }
      });
    }

    doc.save(`budget_report_${id}.pdf`);
  };

  return (
    <div>
      <div className="mb-6 flex justify-end gap-3">
        <button onClick={handleExportPDF} className="btn-secondary"><Download className="h-4 w-4" /> Export PDF</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard label="Total Budget" value={formatCurrency(data.totalBudget)} icon={PieChart} accent="navy" />
        <StatCard label="Spent" value={formatCurrency(data.spent)} icon={Receipt} accent="orange" />
        <StatCard label="Remaining" value={formatCurrency(data.remaining)} accent="success" />
        <StatCard label="Burn Rate" value={`${data.burnRate}%`} accent={data.burnRate > 80 ? 'danger' : 'navy'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="card">
          <h3 className="font-bold text-navy mb-4">Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={doughnutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {doughnutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-navy mb-4">Planned vs Actual</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyBudget || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF3FB" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="planned" fill="#4285F4" name="Planned" />
              <Bar dataKey="actual" fill="#6AADFF" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-4"><h3 className="font-bold text-navy">Recent Expenses</h3></div>
      
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
                        <th className="px-5 py-3 whitespace-nowrap">Category</th>
                        <th className="px-5 py-3 whitespace-nowrap">Vendor</th>
                        <th className="px-5 py-3 whitespace-nowrap">Description</th>
                        <th className="px-5 py-3 whitespace-nowrap text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayExpenses.map((e, i) => (
                        <tr key={e._id} className={i % 2 === 0 ? 'bg-card' : 'bg-info/20'}>
                          <td className="px-5 py-3 whitespace-nowrap"><Badge status={e.category} /></td>
                          <td className="px-5 py-3 font-medium whitespace-nowrap">{e.vendor}</td>
                          <td className="px-5 py-3 text-muted min-w-[200px]">{e.description}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold whitespace-nowrap">{formatCurrency(e.amount)}</td>
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
