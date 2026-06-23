/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Primary Text & Foreground ── */
        navy: {
          DEFAULT: 'rgb(var(--color-navy) / <alpha-value>)',
          dark: 'rgb(var(--color-navy-dark) / <alpha-value>)',
          light: 'rgb(var(--color-navy-light) / <alpha-value>)',
        },
        /* ── Accent (Cool Blue) ── */
        orange: {
          DEFAULT: 'rgb(var(--color-orange) / <alpha-value>)',
          dark: 'rgb(var(--color-orange-dark) / <alpha-value>)',
          light: 'rgb(var(--color-orange-light) / <alpha-value>)',
        },
        /* ── Semantic ── */
        success: 'rgb(74 200 140 / <alpha-value>)',
        warning: 'rgb(230 180 60 / <alpha-value>)',
        danger: 'rgb(220 70 70 / <alpha-value>)',
        /* ── Surfaces ── */
        info: 'rgb(var(--color-info) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        glassBorder: 'var(--color-glass-border)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        glow: '0 0 24px rgba(66, 133, 244, 0.12)',
        'glow-lg': '0 0 48px rgba(66, 133, 244, 0.18)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(32px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-32px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse_ring: {
          '0%': { transform: 'scale(0.95)', opacity: '1' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        },
        revealUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        fadeOut: 'fadeOut 0.2s ease-in',
        slideUp: 'slideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        slideDown: 'slideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        slideLeft: 'slideLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        slideRight: 'slideRight 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        scaleIn: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 2s infinite linear',
        countUp: 'countUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        pulse_ring: 'pulse_ring 1.5s ease-out infinite',
        revealUp: 'revealUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        glassShimmer: 'glassShimmer 3s ease-in-out infinite',
      },
      width: {
        'sidebar': '16rem',
        'sidebar-collapsed': '4.5rem',
      },
    },
  },
  plugins: [],
};
