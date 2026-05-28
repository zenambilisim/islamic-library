'use client';

import { useTranslation } from 'react-i18next';
import { LogOut, Mail } from 'lucide-react';
import HeroPattern from '@/components/home/HeroPattern';
import { adminBtnSecondary } from '@/components/admin/admin-classes';

interface LibraryHeroProps {
  displayName?: string | null;
  email?: string | null;
  onLogout?: () => void;
}

const LibraryHero = ({ displayName, email, onLogout }: LibraryHeroProps) => {
  const { t } = useTranslation();

  const name = displayName?.trim();
  const mail = email?.trim();

  return (
    <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-7 shadow-soft md:p-8">
      <HeroPattern />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {t('readingList.myLibrary')}
          </p>
          {name ? (
            <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-[2.375rem]">
              {name}
            </h1>
          ) : mail ? (
            <h1 className="font-display text-xl font-medium leading-snug tracking-tight text-ink md:text-2xl">
              {mail}
            </h1>
          ) : null}
          {name && mail && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
              <Mail size={14} strokeWidth={1.75} className="shrink-0 text-ink-faint" aria-hidden />
              {mail}
            </p>
          )}
          {!name && !mail && (
            <p className="font-display text-2xl font-medium text-ink">{t('readingList.myLibrary')}</p>
          )}
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-[15px]">
            {t('readingList.pageDescription')}
          </p>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`${adminBtnSecondary} shrink-0`}
          >
            <LogOut size={18} strokeWidth={2} aria-hidden />
            {t('userAuth.logout')}
          </button>
        )}
      </div>
    </section>
  );
};

export default LibraryHero;
