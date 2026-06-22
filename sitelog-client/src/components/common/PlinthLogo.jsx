export default function PlinthLogo({ size = 'md', className = '', iconOnly = false }) {
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
      {/* CSS crop to only show the top portion (the PQ mark) and hide the text below it */}
      <div className={`relative overflow-hidden shrink-0 ${h} aspect-square flex items-start justify-center`}>
        <img
          src="/plinth-logo.png"
          alt="PlinthHQ Logo"
          className="absolute top-0 w-full h-auto max-w-[140%] scale-[1.35] origin-top drop-shadow-md"
        />
      </div>
      {!iconOnly && (
        <div className="flex flex-col items-center text-center">
          <span className={`font-bold tracking-widest ${ts} leading-none`} style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
            <span className="text-navy dark:text-white transition-colors duration-300">PLINTH </span>
            <span className="text-orange transition-colors duration-300">HQ</span>
          </span>
          <span className={`${size === 'xs' || size === 'sm' ? 'text-[0.35em] mt-0.5' : 'text-[0.28em] mt-1'} font-bold tracking-[0.25em] text-navy/70 dark:text-white/70 whitespace-nowrap transition-colors duration-300 uppercase`}>
            FOUNDATION TO FINISH.
          </span>
        </div>
      )}
    </div>
  );
}
