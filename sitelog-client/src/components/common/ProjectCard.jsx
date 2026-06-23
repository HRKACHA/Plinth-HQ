import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';
import Badge from './Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';

export default function ProjectCard({ project }) {
  const spentPct = Math.round((project.spent / project.totalBudget) * 100) || 0;
  const { theme } = useTheme();

  return (
    <Link to={`/projects/${project.id}`} className="group card overflow-hidden p-0 block">
      <div className="relative h-28 sm:h-32 overflow-hidden" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #0f172a 100%)' : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)' }}>
        {project.coverPhoto ? (
          <img src={project.coverPhoto} alt={project.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 opacity-70" />
        ) : (
          <div className="absolute inset-0 transition duration-500 group-hover:scale-105" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #0f172a 100%)' : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--color-card))] via-transparent to-transparent opacity-90" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
          <Badge status={project.status} />
          <span className={`rounded-lg px-2 py-1 font-mono text-sm font-bold shadow-sm ${theme === 'dark' ? 'text-white' : 'text-navy'}`}
            style={{ background: theme === 'dark' ? 'rgba(16,18,24,0.70)' : 'rgba(255,255,255,0.70)', backdropFilter: 'blur(12px)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,40,0.08)' }}>
            {project.progress || 0}%
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4" style={{ background: 'rgb(var(--color-card))' }}>
        <h3 className="font-bold text-base text-navy group-hover:text-orange transition-colors truncate">{project.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-navy/70 dark:text-white/70 h-8">{project.description || 'No description provided.'}</p>
        <div className="mt-3 space-y-1.5 text-[11px] text-navy/70 dark:text-white/70">
          <div className="flex items-center gap-2 truncate"><MapPin className="h-3 w-3 text-orange/50 shrink-0" />{project.location?.city || project.location || 'Unknown Location'}</div>
          <div className="flex items-center gap-2"><Users className="h-3 w-3 text-orange/50 shrink-0" />{project.team || 0} team members</div>
          <div className="flex items-center gap-2 truncate"><Calendar className="h-3 w-3 text-orange/50 shrink-0" />Last log: {project.lastLogDate ? formatDate(project.lastLogDate) : 'No logs yet'}</div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,40,0.06)' }}>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-navy/60 dark:text-white/60 font-medium">Budget used</span>
            <span className="font-mono font-bold text-navy">{spentPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,40,0.04)' }}>
            <div
              className={`h-full rounded-full ${spentPct > 100 ? 'bg-danger' : spentPct > 80 ? 'bg-orange' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-navy/20 dark:text-white/20 text-right tracking-tight">{formatCurrency(project.spent || 0)} / {formatCurrency(project.totalBudget || 0)}</p>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-orange opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span>Open Command Center</span>
          <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
