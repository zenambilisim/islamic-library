'use client';

import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Book, Download, Eye, FileText, HelpCircle, Search, Smartphone } from 'lucide-react';
import UsefulInfoHero from '@/components/useful-info/UsefulInfoHero';

const SectionHeading = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="mb-5 flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
      {icon}
    </span>
    <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">{children}</h2>
  </div>
);

const UsefulInfoPage = () => {
  const { t } = useTranslation();

  const guides = [
    {
      id: 1,
      icon: Download,
      steps: ['guide1Step1', 'guide1Step2', 'guide1Step3', 'guide1Step4'],
    },
    {
      id: 2,
      icon: Eye,
      steps: ['guide2Step1', 'guide2Step2', 'guide2Step3', 'guide2Step4'],
    },
    {
      id: 3,
      icon: Search,
      steps: ['guide3Step1', 'guide3Step2', 'guide3Step3', 'guide3Step4'],
    },
    {
      id: 4,
      icon: Smartphone,
      steps: ['guide4Step1', 'guide4Step2', 'guide4Step3', 'guide4Step4'],
    },
  ];

  const faqs = [
    { question: 'faq1Question', answer: 'faq1Answer' },
    { question: 'faq2Question', answer: 'faq2Answer' },
    { question: 'faq3Question', answer: 'faq3Answer' },
    { question: 'faq4Question', answer: 'faq4Answer' },
  ];

  const fileFormats = [
    {
      format: 'PDF',
      descKey: 'pdfDesc',
      advantages: ['pdfAdv1', 'pdfAdv2', 'pdfAdv3'],
      recommended: 'pdfRecommended',
    },
    {
      format: 'EPUB',
      descKey: 'epubDesc',
      advantages: ['epubAdv1', 'epubAdv2', 'epubAdv3'],
      recommended: 'epubRecommended',
    },
    {
      format: 'DOC',
      descKey: 'docDesc',
      advantages: ['docAdv1', 'docAdv2', 'docAdv3'],
      recommended: 'docRecommended',
    },
  ];

  const scrollToGuides = () => {
    document.getElementById('useful-info-guides')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        <UsefulInfoHero onBrowse={scrollToGuides} />

        <section id="useful-info-guides">
          <SectionHeading icon={<Book size={18} strokeWidth={1.75} />}>
            {t('usefulInfo.usageGuides')}
          </SectionHeading>

          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <article
                  key={guide.id}
                  className="animate-fade-in rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon size={20} strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-medium tracking-tight text-ink">
                        {t(`usefulInfo.guide${guide.id}Title`)}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                        {t(`usefulInfo.guide${guide.id}Desc`)}
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-2 border-t border-[var(--border)] pt-4">
                    {guide.steps.map((step) => (
                      <li
                        key={step}
                        className="text-[13px] leading-relaxed text-ink-muted"
                      >
                        {t(`usefulInfo.${step}`)}
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading icon={<FileText size={18} strokeWidth={1.75} />}>
            {t('usefulInfo.fileFormatsGuide')}
          </SectionHeading>

          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
            {fileFormats.map((format, index) => (
              <article
                key={format.format}
                className="animate-fade-in flex flex-col rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="mb-4 text-center">
                  <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 font-display text-lg font-semibold tracking-tight text-accent">
                    {format.format}
                  </span>
                  <p className="mt-2 text-[12.5px] text-ink-muted">
                    {t(`usefulInfo.${format.descKey}`)}
                  </p>
                </div>

                <div className="flex-1 space-y-3 border-t border-[var(--border)] pt-4">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                    {t('usefulInfo.advantages')}
                  </h4>
                  <ul className="space-y-1.5">
                    {format.advantages.map((advantage) => (
                      <li
                        key={advantage}
                        className="flex items-start gap-2 text-[13px] text-ink-muted"
                      >
                        <span className="mt-0.5 text-accent" aria-hidden>
                          ✓
                        </span>
                        {t(`usefulInfo.${advantage}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-4 border-t border-[var(--border)] pt-3 text-[12.5px] font-medium text-accent">
                  {t(`usefulInfo.${format.recommended}`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading icon={<HelpCircle size={18} strokeWidth={1.75} />}>
            {t('usefulInfo.faq')}
          </SectionHeading>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <article
                key={faq.question}
                className="animate-fade-in rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <h3 className="flex items-start gap-3 font-display text-base font-medium tracking-tight text-ink">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-cream"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  {t(`usefulInfo.${faq.question}`)}
                </h3>
                <p className="mt-3 pl-9 text-[13px] leading-relaxed text-ink-muted">
                  {t(`usefulInfo.${faq.answer}`)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UsefulInfoPage;
