import { useTheme } from '../../context/ThemeContext';

export default function PlinthLogo({ size = 'md', className = '', iconOnly = false }) {
  const { theme } = useTheme();
  const heights = {
    xxs: 'h-10',
    xs: 'h-16',
    sm: 'h-24',
    md: 'h-40',
    lg: 'h-64',
    xl: 'h-80',
  };
  const textSizes = {
    xxs: 'text-sm',
    xs: 'text-lg',
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
  };

  const h = heights[size] || heights.md;
  const ts = textSizes[size] || textSizes.md;

  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${className}`}>
      {/* Crossfading logo with smooth transition */}
      <div className={`relative shrink-0 ${h} flex items-center justify-center`}>
        {/* Dark mode logo */}
        <img
          src="/Plinth_Hq_logo.png"
          alt="PlinthHQ Logo"
          className="absolute inset-0 w-auto h-full object-contain drop-shadow-md"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {/* Light mode logo */}
        <img
          src="/White_logo.png"
          alt="PlinthHQ Logo"
          className="w-auto h-full object-contain"
          style={{
            opacity: theme === 'dark' ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      {!iconOnly && (
        <div className="flex flex-col items-center text-center">
          <span className={`font-bold tracking-widest ${ts} leading-none`} style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
            <span className="text-navy transition-colors duration-500">PLINTH </span>
            <span className="text-orange transition-colors duration-500">HQ</span>
          </span>
          <span className={`${size === 'xs' || size === 'sm' ? 'text-[0.35em] mt-0.5' : 'text-[0.28em] mt-1'} font-bold tracking-[0.25em] text-muted whitespace-nowrap transition-colors duration-500 uppercase`}>
            FOUNDATION TO FINISH.
          </span>
        </div>
      )}
    </div>
  );
}
