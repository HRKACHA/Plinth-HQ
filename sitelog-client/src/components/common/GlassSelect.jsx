import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function GlassSelect({ value, onChange, options = [], accent = 'orange', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const accentColors = {
    orange: 'text-orange hover:text-orange-light',
    danger: 'text-danger hover:text-red-400',
    navy: 'text-white/60 hover:text-white',
    success: 'text-success hover:text-green-400',
  };

  const accentDot = {
    orange: 'bg-orange',
    danger: 'bg-danger',
    navy: 'bg-white/60',
    success: 'bg-success',
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); }}
        className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors duration-200 ${accentColors[accent] || accentColors.orange}`}
      >
        <span className="max-w-[80px] truncate">{selected?.label || 'Select'}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] animate-fadeIn">
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(16,18,24,0.90)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
            <div className="py-1.5 max-h-48 overflow-y-auto scrollbar-hide">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors duration-150
                    ${value === opt.value
                      ? `${accentColors[accent]} bg-white/5`
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${value === opt.value ? accentDot[accent] : 'bg-transparent'}`} />
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="ml-auto h-3 w-3 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
