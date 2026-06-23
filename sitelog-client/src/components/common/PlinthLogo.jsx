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
      <div className={`relative overflow-hidden shrink-0 ${h} aspect-square flex items-start justify-center`}>
        {/* Dark mode logo (white) */}
        <img
          src="/plinth-logo.png"
          alt="PlinthHQ Logo"
          className="absolute top-0 w-full h-auto max-w-[140%] scale-[1.35] origin-top drop-shadow-md"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {/* Light mode logo (inverted to dark) */}
        <img
          src="/plinth-logo.png"
          alt="PlinthHQ Logo"
          className="absolute top-0 w-full h-auto max-w-[140%] scale-[1.35] origin-top"
          style={{
            opacity: theme === 'dark' ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: 'invert(0.85) sepia(0.15) saturate(1.2) hue-rotate(190deg) brightness(0.45)',
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
