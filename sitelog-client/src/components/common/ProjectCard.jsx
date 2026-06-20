import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';
import Badge from './Badge';
import { formatCurrency, formatDate } from '../../data/mockData';

export default function ProjectCard({ project }) {
  const spentPct = Math.round((project.spent / project.totalBudget) * 100) || 0;

  return (
    <Link to={`/projects/${project.id}`} className="group card overflow-hidden p-0 block">
      <div className="relative h-32 sm:h-40 overflow-hidden" style={{ background: 'linear-gradient(135deg, #111827 0%, #1a1d2e 50%, #111827 100%)' }}>
        {project.coverPhoto ? (
          <img src={project.coverPhoto} alt={project.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 opacity-70" />
        ) : (
          <div className="absolute inset-0 transition duration-500 group-hover:scale-105" style={{ background: 'linear-gradient(135deg, #111827 0%, #1e2435 50%, #111827 100%)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--color-card))] via-transparent to-transparent opacity-90" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
          <Badge status={project.status} />
          <span className="rounded-lg px-2 py-1 font-mono text-sm font-bold text-white shadow-sm"
            style={{ background: 'rgba(16,18,24,0.70)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {project.progress || 0}%
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-5" style={{ background: 'rgb(var(--color-card))' }}>
        <h3 className="font-bold text-navy group-hover:text-orange transition-colors truncate">{project.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-white/40 h-10">{project.description || 'No description provided.'}</p>
        <div className="mt-4 space-y-2 text-xs text-white/40">
          <div className="flex items-center gap-2 truncate"><MapPin className="h-3.5 w-3.5 text-orange/50 shrink-0" />{project.location?.city || project.location || 'Unknown Location'}</div>
          <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-orange/50 shrink-0" />{project.team || 0} team members</div>
          <div className="flex items-center gap-2 truncate"><Calendar className="h-3.5 w-3.5 text-orange/50 shrink-0" />Last log: {project.lastLogDate ? formatDate(project.lastLogDate) : 'No logs yet'}</div>
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/30 font-medium">Budget used</span>
            <span className="font-mono font-bold text-navy">{spentPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${spentPct > 80 ? 'bg-danger' : spentPct > 60 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-white/20 text-right tracking-tight">{formatCurrency(project.spent || 0)} / {formatCurrency(project.totalBudget || 0)}</p>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm font-semibold text-orange opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span>Open Command Center</span>
          <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
