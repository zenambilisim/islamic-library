'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import type { Language } from '@/types';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSearchField from '@/components/admin/AdminSearchField';
import {
  adminAlertError,
  adminBtnIcon,
  adminBtnIconDanger,
  adminBtnPrimary,
  adminEmptyState,
  adminLoadingState,
  adminSelect,
  adminTableWrap,
  adminTd,
  adminTdPrimary,
  adminTh,
  adminTheadRow,
  adminTr,
} from '@/components/admin/admin-classes';

const DATA_LANGUAGES: Language[] = ['tr', 'en', 'ru', 'az'];

const AdminCategoriesPage = () => {
  const { t } = useTranslation();
  const [dataLanguage, setDataLanguage] = useState<Language>('tr');
  const { categories, loading, error, refetch, searchQuery, setSearchQuery, debouncedSearch } =
    useSupabaseCategories(dataLanguage);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    const ok = window.confirm(t('admin.categories.deleteConfirm', { name }));
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
      setActionError(err instanceof Error ? err.message : t('admin.categories.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <AdminShell>
        <div className={adminAlertError}>{error}</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <AdminPageHeader title={t('admin.categories.title')}>
        <Link
          href="/admin/categories/new"
          target="_blank"
          rel="noopener noreferrer"
          className={adminBtnPrimary}
        >
          {t('admin.categories.addNew')}
        </Link>
      </AdminPageHeader>

      {actionError && <div className={adminAlertError}>{actionError}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AdminSearchField
          id="admin-categories-search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('admin.categories.searchPlaceholder')}
          label={t('admin.categories.searchLabel')}
        />
        <div className="min-w-[120px]">
          <label htmlFor="admin-categories-data-language" className="sr-only">
            {t('common.language')}
          </label>
          <select
            id="admin-categories-data-language"
            value={dataLanguage}
            onChange={(e) => setDataLanguage(e.target.value as Language)}
            className={adminSelect}
          >
            {DATA_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={adminTableWrap}>
        {loading ? (
          <div className={adminLoadingState}>
            <span>{t('admin.categories.loading')}</span>
          </div>
        ) : categories.length === 0 ? (
          <div className={adminEmptyState}>
            {debouncedSearch ? t('admin.categories.noCategoriesMatch') : t('admin.categories.noCategories')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className={adminTheadRow}>
                  <th className={adminTh}>{t('admin.categories.table.name')}</th>
                  <th className={adminTh}>{t('admin.categories.table.description')}</th>
                  <th className={`${adminTh} text-right w-24`}>{t('admin.categories.table.books')}</th>
                  <th className={`${adminTh} text-right w-32`}>{t('admin.categories.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className={adminTr}>
                    <td className={`${adminTdPrimary} font-medium`}>{c.name}</td>
                    <td className={`${adminTd} max-w-md truncate`}>{c.description || '—'}</td>
                    <td className={`${adminTd} text-right tabular-nums`}>{c.bookCount ?? 0}</td>
                    <td className={`${adminTd} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/categories/${encodeURIComponent(c.id)}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={adminBtnIcon}
                          title={t('admin.categories.table.edit')}
                        >
                          <Pencil size={18} aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(c.id, c.name)}
                          disabled={deletingId !== null}
                          className={adminBtnIconDanger}
                          title={t('admin.categories.table.delete')}
                        >
                          {deletingId === c.id ? (
                            <span className="text-xs">{t('admin.categories.deleting')}</span>
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
    </AdminShell>
  );
};

export default AdminCategoriesPage;
