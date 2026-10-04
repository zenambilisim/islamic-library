'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LANG,
  getLocaleFromPathname,
  localizedPath,
  normalizeLanguage,
  stripLocaleFromPathname,
  type SupportedLanguage,
} from '@/lib/locale';

/** Aktif URL locale (yoksa i18n / default). */
export function useLocale(): SupportedLanguage {
  const pathname = usePathname();
  const { i18n } = useTranslation();
  return (
    getLocaleFromPathname(pathname) ??
    normalizeLanguage(i18n.resolvedLanguage || i18n.language) ??
    DEFAULT_LANG
  );
}

/** Locale önekli path üretici + mevcut path helper’ları. */
export function useLocalizedPath() {
  const locale = useLocale();
  const pathname = usePathname();

  return {
    locale,
    pathname,
    barePath: stripLocaleFromPathname(pathname),
    lp: (path: string) => localizedPath(locale, path),
    switchLocalePath: (nextLocale: string) =>
      localizedPath(nextLocale, stripLocaleFromPathname(pathname)),
  };
}
