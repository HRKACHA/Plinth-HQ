import { useParams, Link } from 'react-router-dom';
import { Lock, Camera, ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { weatherIcons, formatDate } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { logApi } from '../../api/index';
import { mediaUrl } from '../../api/index';

export default function LogDetail() {
  const { id, logId } = useParams();
  const { data: log, loading, error } = useAsync(() => logApi.get(id, logId), [id, logId]);

  if (loading) {
    return (
      <AppLayout backTo={`/projects/${id}/logs`}>
        <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>
      </AppLayout>
    );
  }

  if (error || !log) {
    return (
      <AppLayout backTo={`/projects/${id}/logs`}>
        <p className="text-danger">{error || 'Log not found'}</p>
      </AppLayout>
    );
  }

  const labourList = log.labour || [];

  return (
    <AppLayout backTo={`/projects/${id}/logs`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <span className="text-4xl">{weatherIcons[log.weather] || '☀️'}</span>
          <div>
            <h2 className="text-2xl font-bold text-navy">{formatDate(log.date)}</h2>
            <p className="text-sm text-muted">By {log.author || log.createdBy?.name} {log.temperature ? `· ${log.temperature}°C` : ''}</p>
          </div>
          {log.isLocked && <span className="ml-auto badge bg-muted/20 text-muted"><Lock className="mr-1 h-3 w-3 inline" />Locked</span>}
        </div>

        <div className="card mb-6">
          <h3 className="font-bold text-navy">Activities</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{log.activities}</p>
          {log.remarks && <div className="mt-4 rounded-lg bg-warning/10 p-3 text-sm text-warning"><strong>Remarks:</strong> {log.remarks}</div>}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          <div className="card">
            <h3 className="font-bold text-navy mb-4">Labour Attendance</h3>
            {labourList.map((l) => (
              <div key={l.trade} className="flex justify-between text-sm mb-3 items-center">
                <span className="capitalize text-muted">{l.trade}</span>
                <div className="text-right">
                  <span className="font-mono font-bold block">{l.present} workers</span>
                  {l.wagePerDay > 0 && <span className="text-xs text-muted block">₹{l.wagePerDay}/day</span>}
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-navy/10 flex justify-between font-bold text-navy">
              <span>Total Cost</span>
              <span>₹{labourList.reduce((sum, l) => sum + (l.present * (l.wagePerDay || 0)), 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="card">
            <h3 className="font-bold text-navy mb-4">Materials</h3>
            {(log.materials || []).length ? log.materials.map((m) => (
              <p key={m.name} className="text-sm text-muted">{m.name} — {m.qty} {m.unit}</p>
            )) : <p className="text-sm text-muted">None logged</p>}
          </div>
        </div>

        {(log.photos?.length > 0) && (
          <div className="card">
            <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Camera className="h-5 w-5" /> Photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {log.photos.map((p, i) => (
                <img key={i} src={mediaUrl(p.url)} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        <Link to={`/projects/${id}/logs`} className="btn-secondary mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Back</Link>
      </div>
    </AppLayout>
  );
}
