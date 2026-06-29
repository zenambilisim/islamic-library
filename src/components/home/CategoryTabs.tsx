'use client';

import { useTranslation } from 'react-i18next';
import type { Category } from '@/types';

interface CategoryTabsProps {
  categories: Category[];
  value: string | undefined;
  onChange: (slug: string | undefined) => void;
  maxVisible?: number;
}

const CategoryTabs = ({ categories, value, onChange, maxVisible = 5 }: CategoryTabsProps) => {
  const { t } = useTranslation();
  const visible = categories.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <div className="tabs flex flex-wrap gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`tab flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${
          !value ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
        }`}
      >
        {t('hikme.allCategories')}
      </button>
      {visible.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.slug)}
          className={`tab flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${
            value === cat.slug ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <span className="max-w-[8rem] truncate">{cat.name}</span>
          {cat.bookCount > 0 && (
            <span className="text-[10.5px] opacity-65 tabular-nums">{cat.bookCount}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
