'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Home, KeyRound, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import SiteLogo from '@/components/layout/SiteLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { normalizeLanguage, setLanguageCookie } from '@/lib/locale';
import type { Language } from '@/types';

const LANG_CODES: Language[] = ['tr', 'en', 'ru', 'az'];

const AdminNavbar = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  const handleLanguageChange = (code: Language) => {
    setLanguageCookie(code);
    void i18n.changeLanguage(code);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
      router.refresh();
    }
  };

  const navItems = [
    { key: 'dashboard', label: t('admin.nav.dashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
    {
      key: 'changePassword',
      label: t('admin.nav.changePassword'),
      href: '/admin/settings/password',
      icon: KeyRound,
    },
  ];

  const navLinkClass = (href: string) =>
    `flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
      pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
        ? 'bg-ink text-cream'
        : 'text-ink-muted hover:bg-[var(--surface-2)] hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_90%,transparent)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="flex h-14 items-center justify-between gap-4 md:h-16">
          <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-elev)] p-0.5">
              <SiteLogo size={30} className="h-full w-full" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-base font-semibold tracking-tight text-ink">
                Islamic Library
              </span>
              <span className="ml-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {t('admin.nav.adminArea')}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ key, href, label, icon: Icon }) => (
              <Link key={key} href={href} className={navLinkClass(href)}>
                <Icon size={16} strokeWidth={1.75} />
                <span className="hidden xl:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="hidden items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 sm:flex"
              role="tablist"
            >
              {LANG_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  className={`h-7 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
                    currentLang === code ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

            <ThemeToggle size="sm" />

            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink md:inline-flex"
            >
              <Home size={15} />
              <span className="hidden lg:inline">{t('admin.nav.backToSite')}</span>
            </Link>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 md:inline-flex"
            >
              <LogOut size={15} />
              <span className="hidden lg:inline">{t('admin.nav.logout')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-ink lg:hidden"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="border-t border-[var(--border)] py-3 lg:hidden">
            <div className="mb-3 flex flex-wrap gap-1 sm:hidden">
              {LANG_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    currentLang === code ? 'bg-ink text-cream' : 'bg-[var(--surface-2)] text-ink-muted'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            {navItems.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === href || pathname.startsWith(href)
                    ? 'bg-accent-soft text-accent'
                    : 'text-ink hover:bg-[var(--surface-2)]'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-[var(--border)] pt-2">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] py-2 text-sm font-medium text-ink"
              >
                <Home size={16} />
                {t('admin.nav.backToSite')}
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400"
              >
                <LogOut size={16} />
                {t('admin.nav.logout')}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default AdminNavbar;
