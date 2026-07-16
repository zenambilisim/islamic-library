'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { Award, BookOpen, Globe, Heart, Shield, Users } from 'lucide-react';
import AboutHero from '@/components/about/AboutHero';

const SectionHeading = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <div className="mb-5 flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
      <Icon size={18} strokeWidth={1.75} aria-hidden />
    </span>
    <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">{children}</h2>
  </div>
);

const AboutPage = () => {
  const { t } = useTranslation();

  const features: { icon: LucideIcon; titleKey: string; descKey: string }[] = [
    { icon: Globe, titleKey: 'feature1Title', descKey: 'feature1Desc' },
    { icon: BookOpen, titleKey: 'feature2Title', descKey: 'feature2Desc' },
    { icon: Shield, titleKey: 'feature3Title', descKey: 'feature3Desc' },
    { icon: Users, titleKey: 'feature4Title', descKey: 'feature4Desc' },
    { icon: BookOpen, titleKey: 'feature5Title', descKey: 'feature5Desc' },
    { icon: Award, titleKey: 'feature6Title', descKey: 'feature6Desc' },
  ];

  const scrollToMission = () => {
    document.getElementById('about-mission')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        <AboutHero onBrowse={scrollToMission} />

        <section id="about-mission" className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <article className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-soft md:p-7">
            <SectionHeading icon={Heart}>{t('about.missionTitle')}</SectionHeading>
            <div className="space-y-4 text-[14px] leading-relaxed text-ink-muted">
              <p>{t('about.missionText1')}</p>
              <p>{t('about.missionText2')}</p>
            </div>
          </article>

          <article className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-soft md:p-7">
            <SectionHeading icon={Award}>{t('about.visionTitle')}</SectionHeading>
            <div className="space-y-4 text-[14px] leading-relaxed text-ink-muted">
              <p>{t('about.visionText1')}</p>
              <p>{t('about.visionText2')}</p>
            </div>
          </article>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
              {t('about.featuresTitle', 'Neden Islamic Library?')}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, titleKey, descKey }, index) => (
              <article
                key={titleKey}
                className="animate-fade-in rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="font-display text-lg font-medium tracking-tight text-ink">
                  {t(`about.${titleKey}`)}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  {t(`about.${descKey}`)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
