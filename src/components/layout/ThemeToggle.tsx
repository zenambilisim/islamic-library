'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeToggleProps = {
  className?: string;
  size?: 'sm' | 'md';
};

const ThemeToggle = ({ className = '', size = 'md' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const dim = size === 'sm' ? 15 : 18;
  const box =
    size === 'sm'
      ? 'h-9 w-9 rounded-[10px]'
      : 'h-[38px] w-[38px] rounded-[11px]';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`grid place-items-center border border-[var(--border)] bg-[var(--surface)] text-ink transition-colors hover:bg-[var(--surface-2)] ${box} ${className}`}
      aria-label={t('theme.toggle')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? <Sun size={dim} strokeWidth={1.75} /> : <Moon size={dim} strokeWidth={1.75} />}
    </button>
  );
};

export default ThemeToggle;
