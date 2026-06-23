import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function CustomSelectMenu({ value, onChange, options, placeholder, title, icon: Icon, className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();

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
  
  const isDark = theme === 'dark';
  const dropdownBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,40,0.08)';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-surface border border-navy/10 dark:border-white/10 rounded-xl text-left text-navy dark:text-white focus:outline-none focus:border-blue-500/50 transition flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={selected ? 'text-navy dark:text-white' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full mt-2 w-max min-w-full max-w-[90vw] sm:max-w-xs rounded-2xl shadow-elevated z-[100] overflow-hidden animate-fadeIn ${className.includes('w-') ? 'right-0' : 'left-0'} ${isDark ? 'bg-[#161622]' : 'bg-card'}`} style={{ border: `1px solid ${dropdownBorder}`, backdropFilter: 'blur(24px) saturate(180%)' }}>
          {title && (
            <div className="px-4 py-3 border-b" style={{ borderColor: dropdownBorder }}>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${value === opt.value ? 'bg-orange/10 text-orange' : 'hover:bg-navy/5 dark:hover:bg-white/5 text-navy dark:text-white'}`}
              >
                {(Icon || opt.icon) && (
                  <div className={`p-1.5 rounded-lg shrink-0 ${value === opt.value ? 'bg-orange/20 text-orange' : 'bg-navy/5 dark:bg-white/5'}`}>
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
