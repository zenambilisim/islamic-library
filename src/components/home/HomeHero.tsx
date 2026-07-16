'use client';

import { useTranslation } from 'react-i18next';
import HeroPattern from './HeroPattern';

interface HomeHeroProps {
  totalBooks: number | null;
  totalCategories: number | null;
  localeTag: string;
  onExplore: () => void;
}

const HomeHero = ({ totalBooks, totalCategories, localeTag, onExplore }: HomeHeroProps) => {
  const { t } = useTranslation();

  const booksDisplay =
    totalBooks === null ? '…' : totalBooks.toLocaleString(localeTag);
  const categoriesDisplay =
    totalCategories === null ? '…' : totalCategories.toLocaleString(localeTag);

  return (
    <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-7 md:p-8 shadow-soft">
      <HeroPattern />
      <h1 className="font-display relative text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-[2.375rem]">
        {t('hero.titleLine1')}
        {t('hero.titleEm') ? (
          <>
            <br />
            <em className="font-normal not-italic text-accent">{t('hero.titleEm')}</em>
          </>
        ) : null}
      </h1>
      <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-[15px]">
        {t('hero.subtitle')}
      </p>
      <div className="relative mt-5 flex flex-wrap gap-7">
        <div>
          <span className="font-display block text-[22px] font-semibold leading-none tracking-tight text-ink tabular-nums">
            {booksDisplay}
          </span>
          <span className="mt-1 block text-[11px] tracking-wide text-ink-muted">
            {t('hero.booksCount')}
          </span>
        </div>
        <div>
          <span className="font-display block text-[22px] font-semibold leading-none tracking-tight text-ink">
            4
          </span>
          <span className="mt-1 block text-[11px] tracking-wide text-ink-muted">
            {t('hero.languagesCount')}
          </span>
        </div>
        <div>
          <span className="font-display block text-[22px] font-semibold leading-none tracking-tight text-ink tabular-nums">
            {categoriesDisplay}
          </span>
          <span className="mt-1 block text-[11px] tracking-wide text-ink-muted">
            {t('hero.categoriesCount')}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onExplore}
        className="relative mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-cream transition-transform hover:-translate-y-px"
      >
        {t('hero.exploreButton')}
      </button>
    </section>
  );
};

export default HomeHero;
