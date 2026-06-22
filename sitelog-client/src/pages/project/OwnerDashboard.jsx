import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, CheckCircle, Camera, Share2 } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate, weatherIcons } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { projectApi, logApi, milestoneApi } from '../../api/index';

export default function OwnerDashboard() {
  const { id } = useParams();
  const { data: project } = useAsync(() => projectApi.get(id), [id]);
  const { data: logs = [] } = useAsync(() => logApi.list(id), [id]);
  const { data: milestones = [] } = useAsync(() => milestoneApi.list(id), [id]);
  const [shareLink, setShareLink] = useState('');

  const copyShare = async () => {
    const { shareLink: link } = await projectApi.shareLink(id);
    setShareLink(link);
    navigator.clipboard?.writeText(link);
  };

  if (!project) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  const spentPct = project.totalBudget ? Math.round(((project.spent || 0) / project.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-navy/5 dark:bg-white/5 border border-navy/10 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy">Owner View — Read Only</p>
          <p className="text-xs text-muted">{shareLink || 'Generate a secure share link for building owners'}</p>
        </div>
        <button type="button" onClick={copyShare} className="btn-secondary"><Share2 className="h-4 w-4" /> Copy Share Link</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-xs uppercase text-muted">Progress</p>
          <p className="mt-2 font-mono text-4xl font-bold text-orange">{project.progress}%</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-muted">Budget Burn</p>
          <p className={`mt-2 font-mono text-4xl font-bold ${spentPct > 80 ? 'text-danger' : 'text-navy'}`}>{spentPct}%</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-muted">Milestones Done</p>
          <p className="mt-2 font-mono text-4xl font-bold text-success">
            {milestones.filter((m) => m.status === 'completed').length}/{milestones.length}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Camera className="h-5 w-5" /> Recent Logs</h3>
        <div className="space-y-4">
          {logs.slice(0, 3).map((log) => (
            <div key={log._id} className="rounded-lg border border-navy/10 p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{weatherIcons[log.weather] || '☀️'}</span>
                <div>
                  <p className="font-medium">{formatDate(log.date)}</p>
                  <p className="text-xs text-muted">{log.author || log.createdBy?.name}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">{log.activities}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-navy mb-4">Milestones</h3>
        {milestones.map((m) => (
          <div key={m._id} className="flex items-center justify-between rounded-lg bg-info/50 px-4 py-3 mb-2">
            <p className="text-sm font-medium">{m.title}</p>
            <Badge status={m.status} />
          </div>
        ))}
      </div>

      <div className="card bg-success/5 border-success/20 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-success" />
        <div>
          <p className="font-bold">Spent: {formatCurrency(project.spent || 0)}</p>
          <p className="text-sm text-muted">of {formatCurrency(project.totalBudget)} total budget</p>
        </div>
      </div>
    </div>
  );
}
