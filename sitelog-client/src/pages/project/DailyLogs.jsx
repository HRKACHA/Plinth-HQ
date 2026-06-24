import { Link, useParams } from 'react-router-dom';
import { Plus, Camera, Lock, Filter, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { weatherIcons, formatDate } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { logApi } from '../../api/index';

export default function DailyLogs() {
  const { id } = useParams();
  const { data: logs = [], loading } = useAsync(() => logApi.list(id), [id]);
  const [activeFilter, setActiveFilter] = useState('This Week');

  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'Today') {
      const logDate = new Date(log.date);
      const today = new Date();
      return logDate.getDate() === today.getDate() && logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
    }
    if (activeFilter === 'This Week') {
      const logDate = new Date(log.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return logDate >= weekAgo && logDate <= today;
    }
    return true; // Custom shows all for now
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {['Today', 'This Week', 'Custom'].map((f) => (
            <button 
              key={f} 
              onClick={() => {
                if (f === 'Custom') alert('Custom date picker coming soon!');
                setActiveFilter(f);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeFilter === f ? 'bg-orange text-white shadow-md shadow-orange/20' : 'bg-surface text-navy border border-[var(--color-glass-border)] hover:bg-navy/5 dark:hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
          <button onClick={() => alert('Advanced filters coming soon!')} className="btn-secondary py-2"><Filter className="h-4 w-4" /></button>
        </div>
        <Link to={`/projects/${id}/logs/new`} className="btn-accent"><Plus className="h-4 w-4" /> New Entry</Link>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="card py-16 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted/40" />
          <p className="mt-4 font-semibold text-navy">No log entries found for this filter</p>
          <button onClick={() => setActiveFilter('Custom')} className="btn-accent mt-6 inline-flex">View All Logs</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const logId = log._id || log.id;
            const labourTotal = (log.labour || []).reduce((s, l) => s + (l.present || 0), 0);
            return (
              <Link key={logId} to={`/projects/${id}/logs/${logId}`} className="card flex flex-col gap-4 sm:flex-row sm:items-start group">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-info">
                  <span className="text-2xl">{weatherIcons[log.weather] || '☀️'}</span>
                  {log.temperature && <span className="text-[10px] font-mono text-muted">{log.temperature}°C</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-navy group-hover:text-orange-dark transition">{formatDate(log.date)}</h3>
                    {log.isLocked && <span className="badge bg-muted/20 text-muted"><Lock className="mr-1 h-3 w-3 inline" />Locked</span>}
                  </div>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{log.activities}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span>By {log.author || log.createdBy?.name || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" />{log.photoCount ?? log.photos?.length ?? 0} photos</span>
                    <span>{labourTotal} workers on site</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
