import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelectMenu({ value, onChange, options, placeholder, title, icon: Icon, className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selected = options.find((o) => o.value === value || o.value === String(value));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-left text-white focus:outline-none focus:border-blue-500/50 transition flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={selected ? 'text-white' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-[#161622] border border-white/[0.06] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {title && (
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{title}</span>
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${value === opt.value ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/[0.04] text-white'}`}
              >
                {(Icon || opt.icon) && (
                  <div className={`p-1.5 rounded-lg shrink-0 ${value === opt.value ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                    {Icon ? <Icon size={16} /> : opt.icon ? <opt.icon size={16} /> : null}
                  </div>
                )}
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{opt.label}</p>
                  {opt.desc && <p className="text-xs text-muted truncate mt-0.5">{opt.desc}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
