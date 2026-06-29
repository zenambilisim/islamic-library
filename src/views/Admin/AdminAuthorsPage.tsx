'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';
import type { Language } from '@/types';
import { resolveAuthorDisplayName } from '@/lib/author-display-name';
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

function canEditAuthorInDb(id: string): boolean {
  return Boolean(id) && !id.startsWith('author-');
}

const DATA_LANGUAGES: Language[] = ['tr', 'en', 'ru', 'az'];

const AdminAuthorsPage = () => {
  const { t } = useTranslation();
  const [dataLanguage, setDataLanguage] = useState<Language>('tr');
  const { authors, loading, error, refetch, searchQuery, setSearchQuery, debouncedSearch } =
    useSupabaseAuthors(dataLanguage);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (authorId: string, authorName: string) => {
    if (!canEditAuthorInDb(authorId)) return;
    if (!window.confirm(t('admin.authors.deleteConfirm', { name: authorName }))) return;
    setActionError(null);
    setDeletingId(authorId);
    try {
      const res = await fetch(`/api/authors/by-id/${encodeURIComponent(authorId)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.authors.deleteError'));
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
      <AdminPageHeader title={t('admin.authors.title')}>
        <Link
          href="/admin/authors/new"
          target="_blank"
          rel="noopener noreferrer"
          className={adminBtnPrimary}
        >
          <UserPlus size={18} />
          {t('admin.authors.addNew')}
        </Link>
      </AdminPageHeader>

      {actionError && <div className={adminAlertError}>{actionError}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AdminSearchField
          id="admin-authors-search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('admin.authors.searchPlaceholder')}
          label={t('admin.authors.searchLabel')}
        />
        <div className="min-w-[120px]">
          <label htmlFor="admin-authors-data-language" className="sr-only">
            {t('common.language')}
          </label>
          <select
            id="admin-authors-data-language"
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
            <span>{t('admin.authors.loading')}</span>
          </div>
        ) : authors.length === 0 ? (
          <div className={adminEmptyState}>
            {debouncedSearch ? t('admin.authors.noAuthorsMatch') : t('admin.authors.noAuthors')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className={adminTheadRow}>
                  <th className={adminTh}>{t('admin.authors.table.name')}</th>
                  <th className={`${adminTh} w-16`}>Dil</th>
                  <th className={adminTh}>{t('admin.authors.table.bio')}</th>
                  <th className={`${adminTh} text-right w-20`}>{t('admin.authors.table.books')}</th>
                  <th className={`${adminTh} text-right w-32`}>{t('admin.authors.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {authors.map((author) => (
                  <tr key={author.id} className={adminTr}>
                    <td className={`${adminTdPrimary} font-medium`}>
                      {resolveAuthorDisplayName(author.name, t)}
                    </td>
                    <td className={`${adminTd} uppercase text-xs tabular-nums`}>{author.language}</td>
                    <td className={`${adminTd} max-w-md truncate`}>{author.biography || '—'}</td>
                    <td className={`${adminTd} text-right tabular-nums`}>{author.bookCount || 0}</td>
                    <td className={`${adminTd} text-right`}>
                      {canEditAuthorInDb(author.id) ? (
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/authors/${encodeURIComponent(author.id)}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={adminBtnIcon}
                            title={t('admin.books.table.edit')}
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(author.id, author.name)}
                            disabled={deletingId !== null}
                            className={adminBtnIconDanger}
                            title={t('admin.books.table.delete')}
                          >
                            {deletingId === author.id ? (
                              <span className="text-xs">{t('admin.books.deleting')}</span>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">—</span>
                      )}
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

export default AdminAuthorsPage;
