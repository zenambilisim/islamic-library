'use client';

import { useTranslation } from 'react-i18next';
import type { ReadingStatus } from '@/types';

const TABS: ReadingStatus[] = ['want_to_read', 'reading', 'read'];

interface ReadingListTabsProps {
  value: ReadingStatus;
  onChange: (status: ReadingStatus) => void;
}

const ReadingListTabs = ({ value, onChange }: ReadingListTabsProps) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-wrap gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
      role="tablist"
      aria-label={t('readingList.sectionTitle')}
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          onClick={() => onChange(tab)}
          className={`flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${
            value === tab ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {t(`readingList.status.${tab}`)}
        </button>
      ))}
    </div>
  );
};

export default ReadingListTabs;
