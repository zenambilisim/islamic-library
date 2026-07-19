import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Folder, X, Loader2 } from 'lucide-react';
import { useSupabaseCategories } from '../../hooks/useSupabaseCategories';
import { resolveAppLanguage } from '../../hooks/useSupabaseBooks';
import type { Category, SearchFilters } from '../../types';

interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCategoryNavigate?: () => void;
  initialCategories?: Category[];
}

const FilterSidebar = ({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  onCategoryNavigate,
  initialCategories,
}: FilterSidebarProps) => {
  const { t, i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);
  const { categories, loading, error } = useSupabaseCategories(language, {
    initialCategories,
  });

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy === 'uploadDate' ? undefined : sortBy,
    });
  };

  const hasActiveFilters = filters.sortBy && filters.sortBy !== 'uploadDate';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onToggle} aria-hidden />
      )}

      <aside
        className={`
          fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-lift
          transition-transform duration-300 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:z-10 lg:h-fit lg:max-h-[calc(100vh-var(--header-h)-2rem)]
          lg:w-64 lg:shrink-0 lg:translate-x-0 lg:rounded-editorial lg:border lg:shadow-soft
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            {t('search.filters')}
          </h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-ink-muted underline underline-offset-2"
              >
                {t('search.clearFilters')}
              </button>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] lg:hidden"
              aria-label={t('common.close', 'Kapat')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mb-6 border-b border-[var(--border)] pb-6">
          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {t('search.sortBy')}
          </p>
          <select
            value={filters.sortBy ?? 'uploadDate'}
            onChange={(event) => handleSortChange(event.target.value as SearchFilters['sortBy'])}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="uploadDate">{t('search.sortUploadDate')}</option>
            <option value="alphabetical">{t('search.sortAlphabetical')}</option>
            <option value="mostDownloaded">{t('search.sortMostDownloaded')}</option>
          </select>
        </div>

        <div>
          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {t('search.filterByCategory')}
          </p>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && categories.length > 0 && (
            <ul className="space-y-0.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${encodeURIComponent(category.slug)}`}
                    onClick={() => onCategoryNavigate?.()}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <Folder size={16} className="shrink-0 text-accent" strokeWidth={1.75} />
                    <span className="line-clamp-2 font-medium">{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && categories.length === 0 && (
            <p className="rounded-xl bg-[var(--surface-2)] p-4 text-center text-sm text-ink-muted">
              {t('categories.noCategories')}
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
