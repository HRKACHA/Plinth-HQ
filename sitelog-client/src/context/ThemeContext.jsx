import { createContext, useContext, useEffect, useState, useCallback, useMemo, memo } from 'react';

// Separate contexts: components needing only toggleTheme won't re-render on theme change
const ThemeValueContext = createContext(null);
const ThemeActionsContext = createContext(null);

// Pre-cache the initial theme synchronously to avoid flash
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('plinthhq_theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

// Apply theme class synchronously (also runs before first render in index.html)
function applyThemeToDOM(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme class immediately on change — no requestAnimationFrame delay
  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem('plinthhq_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Stable reference — only changes when toggleTheme changes (never)
  const actions = useMemo(() => ({ toggleTheme }), [toggleTheme]);

  return (
    <ThemeActionsContext.Provider value={actions}>
      <ThemeValueContext.Provider value={theme}>
        {children}
      </ThemeValueContext.Provider>
    </ThemeActionsContext.Provider>
  );
}

// Hook for components that need the theme value (will re-render on theme change)
export function useThemeValue() {
  const theme = useContext(ThemeValueContext);
  if (theme === null) {
    throw new Error('useThemeValue must be used within a ThemeProvider');
  }
  return theme;
}

// Hook for components that only need to toggle (will NOT re-render on theme change)
export function useThemeActions() {
  const actions = useContext(ThemeActionsContext);
  if (!actions) {
    throw new Error('useThemeActions must be used within a ThemeProvider');
  }
  return actions;
}

// Backward-compatible hook — returns both (components using this WILL re-render)
export function useTheme() {
  const theme = useThemeValue();
  const { toggleTheme } = useThemeActions();
  return { theme, toggleTheme };
}
