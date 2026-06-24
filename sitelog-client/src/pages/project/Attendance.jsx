import { useParams } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { logApi } from '../../api/index';

const TRADES = ['mason', 'carpenter', 'electrician', 'plumber', 'welder', 'helper'];
const TRADE_RATES = {
  mason: 800,
  carpenter: 750,
  electrician: 900,
  plumber: 850,
  welder: 950,
  helper: 500
};

import DateAccordion from '../../components/common/DateAccordion';

export default function Attendance() {
  const { id } = useParams();
  const { data: logs = [], loading } = useAsync(() => logApi.list(id), [id]);

  if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  // Group logs by date to support multiple logs per day
  const logsByDate = {};
  logs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = [];
    logsByDate[log.date].push(log);
  });
  
  // Sort dates descending (latest first)
  const sortedDates = Object.keys(logsByDate).sort((a, b) => new Date(b) - new Date(a));
  
  // Aggregate labour for the most recent day
  const latestDate = sortedDates[0];
  const latestLogs = latestDate ? logsByDate[latestDate] : [];
  const latestLabourMap = {};
  
  latestLogs.forEach(log => {
    (log.labour || []).forEach(l => {
      latestLabourMap[l.trade] = (latestLabourMap[l.trade] || 0) + l.present;
    });
  });
  
  const totalPresent = Object.values(latestLabourMap).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="card">
          <p className="text-xs uppercase text-muted">Latest Headcount {latestDate ? `(${new Date(latestDate).toLocaleDateString()})` : ''}</p>
          <p className="mt-2 font-mono text-3xl font-bold text-navy">{totalPresent}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-muted">Trades Active</p>
          <p className="mt-2 font-mono text-3xl font-bold text-orange-dark">{TRADES.filter((t) => latestLabourMap[t] > 0).length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-muted">Total Log Entries</p>
          <p className="mt-2 font-mono text-3xl font-bold text-success">{logs.length}</p>
          <p className="flex items-center gap-1 text-sm text-success"><TrendingUp className="h-3.5 w-3.5" /> From {sortedDates.length} Days</p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Labour by Trade (Latest Day)</h3>
        <div className="space-y-4">
          {TRADES.map((trade) => {
            const count = latestLabourMap[trade] || 0;
            return (
              <div key={trade}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{trade}</span>
                  <span className="font-mono font-bold">{count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-info">
                  <div className="h-full rounded-full bg-navy" style={{ width: `${(count / 30) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="card py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-muted/40" />
          <p className="mt-4 font-semibold text-navy">No attendance records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date, index) => {
            const dayLogs = logsByDate[date];
            const map = {};
            
            // Aggregate all logs for this specific date
            dayLogs.forEach(log => {
              (log.labour || []).forEach(l => {
                const wage = l.wagePerDay || TRADE_RATES[l.trade] || 0;
                const key = `${l.trade}_${wage}`;
                if (!map[key]) {
                  map[key] = { trade: l.trade, present: 0, wage: wage };
                }
                map[key].present += l.present;
              });
            });
            
            const total = Object.values(map).reduce((a, b) => a + b.present, 0);
            const cost = Object.values(map).reduce((sum, l) => sum + (l.present * l.wage), 0);

            return (
              <DateAccordion 
                key={date} 
                date={date} 
                defaultOpen={index === 0}
                summary={`${total} workers • Total Cost: ₹${cost.toLocaleString('en-IN')} (${dayLogs.length} logs)`}
              >
                <div className="overflow-x-auto rounded-xl border border-navy/10 bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy/10 bg-info/50 text-left text-xs uppercase text-muted">
                        <th className="px-5 py-3 whitespace-nowrap">Trade</th>
                        <th className="px-5 py-3 whitespace-nowrap text-right">Workers</th>
                        <th className="px-5 py-3 whitespace-nowrap text-right">Rate (₹)</th>
                        <th className="px-5 py-3 whitespace-nowrap text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(map).map((data, idx) => {
                        if (data.present === 0) return null;
                        const tradeCost = data.present * data.wage;
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-info/20'}>
                            <td className="px-5 py-3 font-medium capitalize whitespace-nowrap">{data.trade}</td>
                            <td className="px-5 py-3 text-right font-mono font-bold whitespace-nowrap">{data.present}</td>
                            <td className="px-5 py-3 text-right text-muted whitespace-nowrap">₹{data.wage}/day</td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-orange-dark whitespace-nowrap">₹{tradeCost.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
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
