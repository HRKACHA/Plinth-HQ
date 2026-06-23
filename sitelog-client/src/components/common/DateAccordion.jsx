import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CalendarDays } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DateAccordion({ date, summary, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const { theme } = useTheme();

  // We use grid transition for smooth expand/collapse
  return (
    <div className="card overflow-hidden p-0 mb-4 transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-navy/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-navy text-base">
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h4>
            {summary && <p className="text-sm text-muted mt-0.5">{summary}</p>}
          </div>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="p-5" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(120,140,200,0.10)', background: theme === 'dark' ? 'rgba(0,0,0,0.20)' : 'rgba(220,228,255,0.40)' }} ref={contentRef}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
