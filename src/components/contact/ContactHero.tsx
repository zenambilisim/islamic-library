'use client';

import { useTranslation } from 'react-i18next';
import HeroPattern from '@/components/home/HeroPattern';

interface ContactHeroProps {
  onBrowse?: () => void;
}

const ContactHero = ({ onBrowse }: ContactHeroProps) => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-7 md:p-8 shadow-soft">
      <HeroPattern />
      <h1 className="font-display relative text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-[2.375rem]">
        {t('contact.heroTitleLine1')}
        <br />
        <em className="font-normal not-italic text-accent">{t('contact.heroTitleEm')}</em>
      </h1>
      <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-[15px]">
        {t('contact.pageDescription')}
      </p>
      {onBrowse && (
        <button
          type="button"
          onClick={onBrowse}
          className="relative mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-cream transition-transform hover:-translate-y-px"
        >
          {t('contact.browseForm')}
        </button>
      )}
    </section>
  );
};

export default ContactHero;
