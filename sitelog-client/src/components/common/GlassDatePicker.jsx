import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GlassDatePicker({ value, onChange, required, className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure currentMonth updates if value changes externally, but only when popover is closed
  useEffect(() => {
    if (value && !isOpen) {
      setCurrentMonth(new Date(value));
    }
  }, [value, isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (day) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange({ target: { value: formatted } });
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Create grid cells
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Format display value
  let displayValue = '';
  if (value) {
    // Handle timezone parsing properly by creating a local date
    const [y, m, d] = value.split('-');
    if (y && m && d) {
       displayValue = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Input */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(!isOpen); }}
      >
        <span className={value ? 'text-navy' : 'text-muted/60'}>
          {value ? displayValue : 'Select a date...'}
        </span>
        <Calendar className="h-4 w-4 text-muted/60 shrink-0 ml-2" />
      </div>

      {/* Hidden native input for required validation form submission */}
      <input type="text" className="hidden" required={required} value={value || ''} readOnly />

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 p-4 card shadow-2xl animate-fadeIn border border-[rgba(255,255,255,0.1)]" style={{ background: 'rgba(15,20,30,0.85)', backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded-md text-muted hover:text-navy dark:text-white hover:bg-navy/10 dark:bg-white/10 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-navy dark:text-white tracking-wide">
                {monthNames[month]}
              </span>
              <div className="relative flex items-center">
                <select 
                  value={year}
                  onChange={(e) => setCurrentMonth(new Date(Number(e.target.value), month, 1))}
                  className="bg-transparent hover:bg-navy/10 dark:bg-white/10 rounded py-0.5 pl-1 pr-4 text-navy dark:text-white font-semibold outline-none cursor-pointer tracking-wide appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 30 + i).map(y => (
                    <option key={y} value={y} className="bg-[#0f141e] text-white">{y}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-1 flex items-center">
                  <svg className="h-3 w-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded-md text-muted hover:text-navy dark:text-white hover:bg-navy/10 dark:bg-white/10 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted/80 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="h-8 w-8" />
            ))}
            {days.map(day => {
              // Construct string to compare YYYY-MM-DD reliably
              const dString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              const isSelected = value === dString;
              const todayDate = new Date();
              const todayString = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
              const isToday = todayString === dString;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`
                    h-8 w-full rounded-md flex items-center justify-center text-sm transition-all
                    ${isSelected ? 'bg-orange text-white shadow-md shadow-orange/20 font-bold' : 
                      isToday ? 'border border-orange/50 text-orange font-bold hover:bg-navy/5 dark:hover:bg-white/5' : 
                      'text-navy/80 dark:text-white/80 hover:bg-navy/10 dark:bg-white/10 hover:text-navy dark:text-white'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
