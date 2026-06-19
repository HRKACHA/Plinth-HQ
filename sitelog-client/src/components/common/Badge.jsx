export default function Badge({ status, children }) {
  const colors = {
    active: 'bg-success/20 text-success',
    planning: 'bg-white/5 text-white/60',
    onHold: 'bg-warning/20 text-warning',
    completed: 'bg-white/10 text-white/40',
    planned: 'bg-white/5 text-white/60',
    inProgress: 'bg-orange/20 text-orange',
    delayed: 'bg-danger/20 text-danger',
    material: 'bg-white/5 text-white/60',
    labour: 'bg-orange/10 text-orange',
    equipment: 'bg-warning/10 text-warning',
    overhead: 'bg-white/5 text-white/40',
    other: 'bg-white/5 text-white/60',
    drawing: 'bg-white/5 text-white/60',
    contract: 'bg-success/10 text-success',
    permit: 'bg-warning/10 text-warning',
    BOQ: 'bg-orange/10 text-orange',
    inspection: 'bg-danger/10 text-danger',
  };

  const label = children || status?.replace(/([A-Z])/g, ' $1').trim();
  return (
    <span className={`badge capitalize ${colors[status] || 'bg-white/5 text-white/60'}`}>
      {label}
    </span>
  );
}
