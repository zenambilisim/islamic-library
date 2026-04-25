'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import type { Language } from '@/types';

const UserCategoriesPage = () => {
  const { t } = useTranslation();
  const [dataLanguage, setDataLanguage] = useState<Language>('tr');
  const { categories, loading, error, refetch, searchQuery, setSearchQuery, debouncedSearch } =
    useSupabaseCategories(dataLanguage);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    const ok = window.confirm(t('user.categories.deleteConfirm', { name }));
    if (!ok) return;
    setActionError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('user.categories.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('user.categories.title')}</h1>
        <Link
          href="/user/categories/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          {t('user.categories.addNew')}
        </Link>
      </div>
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="admin-categories-search" className="sr-only">
          {t('user.categories.searchLabel')}
        </label>
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={18}
            aria-hidden
          />
          <input
            id="admin-categories-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('user.categories.searchPlaceholder')}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
        <div className="min-w-[120px]">
          <label htmlFor="admin-categories-data-language" className="sr-only">
            {t('common.language')}
          </label>
          <select
            id="admin-categories-data-language"
            value={dataLanguage}
            onChange={(e) => setDataLanguage(e.target.value as Language)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="tr">TR</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="az">AZ</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            {t('user.categories.loading')}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {debouncedSearch ? t('user.categories.noCategoriesMatch') : t('user.categories.noCategories')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('user.categories.table.name')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('user.categories.table.description')}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                    {t('user.categories.table.books')}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                    {t('user.categories.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-4 font-medium text-gray-900">{c.name}</td>
                    <td className="py-2 px-4 text-gray-600 max-w-md truncate">{c.description || '—'}</td>
                    <td className="py-2 px-4 text-right text-gray-600 tabular-nums">{c.bookCount ?? 0}</td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/user/categories/${encodeURIComponent(c.id)}/edit`}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 inline-flex"
                          title={t('user.categories.table.edit')}
                        >
                          <Pencil size={18} aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId !== null}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('user.categories.table.delete')}
                        >
                          {deletingId === c.id ? (
                            <span className="text-xs">{t('user.categories.deleting')}</span>
                          ) : (
                            <Trash2 size={18} aria-hidden />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCategoriesPage;
