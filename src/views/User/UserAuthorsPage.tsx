'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';

function canEditAuthorInDb(id: string): boolean {
  return Boolean(id) && !id.startsWith('author-');
}

const UserAuthorsPage = () => {
  const { t, i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);
  const { authors, loading, error, refetch } = useSupabaseAuthors(language);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const handleDelete = async (authorId: string, authorName: string) => {
    if (!canEditAuthorInDb(authorId)) return;
    if (!window.confirm(t('user.authors.deleteConfirm', { name: authorName }))) return;
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
      setActionError(err instanceof Error ? err.message : t('user.authors.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('user.authors.title')}</h1>
        <Link
          href="/user/authors/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          <UserPlus size={18} />
          {t('user.authors.addNew')}
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <span>{t('user.authors.loading')}</span>
          </div>
        ) : authors.length === 0 ? (
          <div className="py-16 text-center text-gray-500">{t('user.authors.noAuthors')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('user.authors.table.name')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    Dil
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('user.authors.table.bio')}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                    {t('user.authors.table.books')}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                    {t('user.authors.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {authors.map((author) => (
                  <tr
                    key={author.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-2 px-4 font-medium text-gray-900">{author.name}</td>
                    <td className="py-2 px-4 text-gray-600 uppercase text-xs tabular-nums">
                      {author.language}
                    </td>
                    <td className="py-2 px-4 text-gray-600 max-w-md truncate">{author.biography || '—'}</td>
                    <td className="py-2 px-4 text-right text-gray-600 tabular-nums">
                      {author.bookCount || 0}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {canEditAuthorInDb(author.id) ? (
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/user/authors/${encodeURIComponent(author.id)}/edit`}
                            className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 inline-flex"
                            title={t('user.books.table.edit')}
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(author.id, author.name)}
                            disabled={deletingId !== null}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('user.books.table.delete')}
                          >
                            {deletingId === author.id ? (
                              <span className="text-xs">{t('user.books.deleting')}</span>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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

export default UserAuthorsPage;
