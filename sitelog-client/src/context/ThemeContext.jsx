import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const ThemeContext = createContext(null);

const THEME_TRANSITION_DURATION = 600; // ms — matches CSS transition

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('plinthhq_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to dark
    return 'dark';
  });
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('plinthhq_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const root = window.document.documentElement;

    // Clear any pending removal from a previous rapid toggle
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    // Enable global smooth transition BEFORE the class swap
    root.classList.add('theme-transitioning');

    // Toggle theme on the next frame so the transition class is painted first
    requestAnimationFrame(() => {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

      // Remove the transition class after animations complete
      // so it doesn't interfere with normal hover/interaction transitions
      transitionTimerRef.current = setTimeout(() => {
        root.classList.remove('theme-transitioning');
        transitionTimerRef.current = null;
      }, THEME_TRANSITION_DURATION);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
