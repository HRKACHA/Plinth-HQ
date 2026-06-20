export default function StatCard({ label, value, sub, icon: Icon, accent = 'navy', children }) {
  const accents = {
    navy: 'text-white/60',
    orange: 'text-orange',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
  };

  const bgAccents = {
    navy: 'rgba(255,255,255,0.04)',
    orange: 'rgba(66,133,244,0.08)',
    success: 'rgba(74,200,140,0.08)',
    danger: 'rgba(220,70,70,0.08)',
    warning: 'rgba(230,180,60,0.08)',
  };

  return (
    <div className="card flex items-start gap-3 sm:gap-4 relative group">
      {Icon && (
        <div className={`relative flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-105 ${accents[accent]}`}
          style={{ background: bgAccents[accent] }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
        </div>
      )}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/30 truncate">{label}</p>
          {children}
        </div>
        <p className="font-mono text-base sm:text-xl xl:text-2xl font-bold text-navy tracking-tighter break-all">{value}</p>
        {sub && <p className="mt-1 text-xs font-medium text-white/30 break-words">{sub}</p>}
      </div>
    </div>
  );
}
