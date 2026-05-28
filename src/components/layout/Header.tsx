'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search, Menu, X, Library, LogIn } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import { useUserAuth } from '@/contexts/UserAuthContext';
import type { Language } from '../../types';

const LANG_CODES: Language[] = ['tr', 'en', 'ru', 'az'];

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, isLoading: authLoading } = useUserAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { searchInput, setSearchInput, submitSearch, clearSearch, placeholder } = useSearch();

  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentLangCode =
    (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] ?? 'en';

  const navigationItems = [
    { key: 'home', label: t('navigation.home'), href: '/' },
    { key: 'categories', label: t('navigation.categories'), href: '/categories' },
    { key: 'authors', label: t('navigation.authors'), href: '/authors' },
    { key: 'usefulInfo', label: t('navigation.usefulInfo'), href: '/useful-info' },
    { key: 'about', label: t('navigation.about'), href: '/about' },
    { key: 'contact', label: t('navigation.contact'), href: '/contact' },
  ];

  const handleLanguageChange = (langCode: Language) => {
    i18n.changeLanguage(langCode);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    submitSearch();
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    clearSearch();
    setIsMenuOpen(false);
  };

  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 h-[var(--header-h)] border-b border-[var(--border)] bg-cream/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-site items-center px-4 md:px-6">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-[var(--surface-3)]" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-cream/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <div className="flex h-[var(--header-h)] items-center gap-4 md:gap-6">
          <Link href="/" onClick={handleLogoClick} className="flex shrink-0 items-center gap-3">
            <div className="font-arabic grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-ink pt-0.5 text-[22px] font-bold leading-none text-cream">
              م
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-[22px] font-semibold leading-none tracking-tight text-ink">
                Islamic Library
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                {t('common.siteTagline', 'İslami Dijital Kütüphane')}
              </div>
            </div>
          </Link>

          <form
            className="hidden min-w-0 flex-1 md:flex md:max-w-xl lg:max-w-2xl"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <div className="flex h-11 w-full items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 transition-colors focus-within:border-accent focus-within:bg-[var(--bg-elev)]">
              <Search size={16} className="shrink-0 text-ink-faint" aria-hidden />
              <input
                type="search"
                placeholder={placeholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                aria-label={placeholder}
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 sm:flex"
              role="tablist"
            >
              {LANG_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  className={`h-[30px] rounded-full px-3 text-xs font-semibold tracking-wide transition-colors ${
                    currentLangCode === code
                      ? 'bg-ink text-cream'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

            {!authLoading &&
              (user ? (
                <Link
                  href="/library"
                  className={`hidden items-center gap-1.5 rounded-[11px] border px-3 py-2 text-sm font-medium transition-colors md:inline-flex ${
                    pathname === '/library'
                      ? 'border-accent bg-accent text-white'
                      : 'border-[var(--border)] bg-[var(--surface)] text-ink hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Library size={16} />
                  <span className="hidden lg:inline">{t('readingList.myLibrary')}</span>
                </Link>
              ) : (
                <Link
                  href="/user/login"
                  className="hidden items-center gap-1.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-[var(--surface-2)] md:inline-flex"
                >
                  <LogIn size={16} />
                  <span className="hidden lg:inline">{t('userAuth.loginShort')}</span>
                </Link>
              ))}

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="grid h-[38px] w-[38px] place-items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] text-ink lg:hidden"
              aria-expanded={isMenuOpen}
              aria-label={t('navigation.menu', 'Menü')}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="hidden border-t border-[var(--border)] py-2 lg:block">
          <ul className="flex flex-wrap items-center gap-1">
            {navigationItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-ink text-cream'
                      : 'text-ink-muted hover:bg-[var(--surface-2)] hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <form className="border-t border-[var(--border)] px-4 py-3 md:hidden" onSubmit={handleSearchSubmit} role="search">
        <div className="flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3">
          <Search size={16} className="shrink-0 text-ink-faint" />
          <input
            type="search"
            placeholder={placeholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
            aria-label={placeholder}
          />
          <button type="submit" className="shrink-0 text-sm font-semibold text-accent">
            {t('common.search')}
          </button>
        </div>
      </form>

      {isMenuOpen && (
        <nav className="border-t border-[var(--border)] bg-[var(--bg-elev)] px-4 py-3 lg:hidden">
          <div className="mb-3 flex flex-wrap gap-1">
            {LANG_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleLanguageChange(code)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  currentLangCode === code ? 'bg-ink text-cream' : 'bg-[var(--surface-2)] text-ink-muted'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === item.href ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-[var(--surface-2)]'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!authLoading && (
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              {user ? (
                <Link
                  href="/library"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Library size={16} />
                  {t('readingList.myLibrary')}
                </Link>
              ) : (
                <Link
                  href="/user/login"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn size={16} />
                  {t('userAuth.loginShort')}
                </Link>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
