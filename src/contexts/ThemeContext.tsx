'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyThemeClass,
  normalizeTheme,
  readThemeCookieFromDocument,
  resolveClientTheme,
  setThemeCookie,
  type Theme,
} from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({
  children,
  initialTheme = 'light',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => normalizeTheme(initialTheme));

  useLayoutEffect(() => {
    const cookieTheme = readThemeCookieFromDocument();

    if (cookieTheme && cookieTheme !== initialTheme) {
      setThemeState(cookieTheme);
      applyThemeClass(cookieTheme);
      return;
    }

    const resolved = resolveClientTheme(initialTheme);
    if (!cookieTheme) {
      setThemeCookie(resolved);
    } else {
      applyThemeClass(resolved);
    }
    setThemeState(resolved);
  }, [initialTheme]);

  const setTheme = useCallback((next: Theme) => {
    const value = normalizeTheme(next);
    setThemeState(value);
    setThemeCookie(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      setThemeCookie(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
