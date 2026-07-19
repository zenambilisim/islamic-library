'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import type { Category, SearchFilters } from '@/types';

interface HomeFiltersPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  activeCategorySlug?: string;
  onCategorySelect: (slug: string | undefined) => void;
  initialCategories?: Category[];
}

const HomeFiltersPanel = ({
  filters,
  onFiltersChange,
  activeCategorySlug,
  onCategorySelect,
  initialCategories,
}: HomeFiltersPanelProps) => {
  const { t, i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);
  const { categories, loading, error } = useSupabaseCategories(language, {
    initialCategories,
  });

  const clearAll = () => {
    onCategorySelect(undefined);
    onFiltersChange({});
  };

  const handleSort = (sortBy: SearchFilters['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy === 'uploadDate' ? undefined : sortBy,
    });
  };

  const sortPills: { id: SearchFilters['sortBy']; label: string }[] = [
    { id: 'uploadDate', label: t('search.sortUploadDate') },
    { id: 'alphabetical', label: t('search.sortAlphabetical') },
    { id: 'mostDownloaded', label: t('search.sortMostDownloaded') },
  ];

  const currentSort = filters.sortBy ?? 'uploadDate';

  return (
    <aside className="filters-panel h-full overflow-y-auto rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">
          {t('search.filters')}
        </h3>
        <button
          type="button"
          onClick={clearAll}
          className="text-[11.5px] text-ink-muted underline underline-offset-2"
        >
          {t('search.clearFilters')}
        </button>
      </div>

      <div className="mb-5 border-b border-[var(--border)] pb-5">
        <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {t('search.sortBy')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sortPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleSort(pill.id)}
              className={`rounded-full border px-2.5 py-1.5 text-[11.5px] transition-colors ${
                currentSort === pill.id
                  ? 'border-ink bg-ink text-cream'
                  : 'border-[var(--border)] bg-[var(--surface)] text-ink-muted hover:border-[var(--border-strong)]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {t('search.filterByCategory')}
        </p>

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {!loading && !error && (
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => onCategorySelect(undefined)}
                className={`filter-cat flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                  !activeCategorySlug
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'text-ink hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>{t('hikme.allCategories')}</span>
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onCategorySelect(cat.slug)}
                  className={`filter-cat flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                    activeCategorySlug === cat.slug
                      ? 'bg-accent-soft font-semibold text-accent'
                      : 'text-ink hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span className="line-clamp-2 text-left">{cat.name}</span>
                  {cat.bookCount > 0 && (
                    <span
                      className={`ml-2 shrink-0 text-[11px] tabular-nums ${
                        activeCategorySlug === cat.slug ? 'text-accent/70' : 'text-ink-faint'
                      }`}
                    >
                      {cat.bookCount.toLocaleString()}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {categories.length > 0 && (
          <Link
            href="/categories"
            className="mt-4 block text-center text-xs font-medium text-accent hover:underline"
          >
            {t('navigation.categories')} →
          </Link>
        )}
      </div>
    </aside>
  );
};

export default HomeFiltersPanel;
