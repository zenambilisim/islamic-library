'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
];

type LanguageSelectorProps = {
  /** Tam etiket veya yalnızca bayrak */
  variant?: 'default' | 'compact';
  className?: string;
};

export function LanguageSelector({ variant = 'default', className = '' }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentLangCode =
    (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] ?? 'en';

  const currentFlag = LANGUAGES.find((l) => l.code === currentLangCode)?.flag;

  const handleLanguageChange = (langCode: Language) => {
    void i18n.changeLanguage(langCode);
  };

  if (!isMounted) {
    return (
      <div className={`h-10 w-28 rounded-xl bg-gray-100/80 ${className}`} aria-hidden />
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-primary-50 hover:to-purple-50 transition-all duration-300 shadow-sm"
        aria-haspopup="listbox"
        aria-label={t('common.language')}
      >
        <Globe size={16} className="text-primary-600 shrink-0" />
        {variant === 'compact' ? (
          <span className="text-sm font-medium text-gray-700">{currentFlag}</span>
        ) : (
          <span className="text-sm font-medium text-gray-700">{t('common.language')}</span>
        )}
      </button>

      <div
        role="listbox"
        className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50"
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            role="option"
            aria-selected={currentLangCode === lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 first:rounded-t-md last:rounded-b-md ${
              currentLangCode === lang.code ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
