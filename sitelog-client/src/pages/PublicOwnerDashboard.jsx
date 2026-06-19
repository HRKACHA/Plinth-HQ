import { useParams } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import Badge from '../components/common/Badge';
import { formatCurrency, formatDate, weatherIcons } from '../data/mockData';
import { useAsync } from '../hooks/useAsync';
import { ownerApi } from '../api/index';

export default function PublicOwnerDashboard() {
  const { shareToken } = useParams();
  const { data, loading, error } = useAsync(() => ownerApi.get(shareToken), [shareToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-info">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-danger">{error || 'Invalid share link'}</p>
      </div>
    );
  }

  const { project, logs, milestones } = data;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card px-6 py-4 border-b border-[var(--color-glass-border)]">
        <div className="flex items-center gap-3 text-navy">
          <HardHat className="h-6 w-6 text-orange" />
          <span className="text-xl font-bold tracking-tight">PlinthHQ</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-navy">{project.name}</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card text-center">
            <p className="text-xs text-muted">Progress</p>
            <p className="font-mono text-3xl font-bold text-orange">{project.progress}%</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">Budget Used</p>
            <p className="font-mono text-3xl font-bold text-navy">{project.burnRate}%</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">Spent</p>
            <p className="font-mono text-xl font-bold">{formatCurrency(project.spent)}</p>
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold text-navy mb-4">Recent Site Logs</h2>
          {logs.map((log) => (
            <div key={log._id} className="border-b border-[var(--color-glass-border)] py-3 last:border-0">
              <div className="flex items-center gap-2">
                <span>{weatherIcons[log.weather]}</span>
                <span className="font-medium">{formatDate(log.date)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{log.activities}</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="font-bold text-navy mb-4">Milestones</h2>
          {milestones.map((m) => (
            <div key={m._id} className="flex justify-between py-2">
              <span className="text-sm">{m.title}</span>
              <Badge status={m.status} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
