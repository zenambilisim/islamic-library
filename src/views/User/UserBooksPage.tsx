'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { BookPlus, FolderUp, Trash2 } from 'lucide-react';
import type { Book } from '@/types';
import type { Language } from '@/types';
import { useUserBooksPaginated } from '@/hooks/useUserBooksPaginated';
import { useBookModal } from '@/contexts/BookModalContext';

function getLocalized(
  value: string,
  translations: { tr: string; en: string; ru: string; az: string } | undefined,
  lang: string
): string {
  const key = (translations && lang in translations ? lang : 'en') as Language;
  return (translations && translations[key]) || value;
}

const UserBooksPage = () => {
  const { t, i18n } = useTranslation();
  const { openDetails } = useBookModal();
  const lang = i18n.language;

  const {
    books,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    refetch,
  } = useUserBooksPaginated(20);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (book: Book) => {
    if (!window.confirm(t('user.books.deleteConfirm'))) return;
    setDeleteError(null);
    setDeletingId(book.id);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      await refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('user.books.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('user.books.title')}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/user/books/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            <BookPlus size={18} />
            {t('user.books.addNew')}
          </Link>
          <Link
            href="/user/books/bulk"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            <FolderUp size={18} />
            {t('user.nav.bulkUpload')}
          </Link>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <span>{t('user.books.loading')}</span>
          </div>
        ) : books.length === 0 ? (
          <div className="py-16 text-center text-gray-500">{t('user.books.noBooks')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                      {t('user.books.table.cover')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('user.books.table.title')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('user.books.table.author')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                      {t('user.books.table.category')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                      {t('user.books.table.year')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                      {t('user.books.table.pages')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      {t('user.books.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book: Book) => (
                    <tr
                      key={book.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-2 px-4">
                        <button
                          type="button"
                          onClick={() => openDetails(book)}
                          className="block w-10 h-14 relative rounded overflow-hidden bg-gray-100 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {book.coverImage ? (
                            <Image
                              src={book.coverImage}
                              alt=""
                              width={40}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-gray-400 text-xs">—</span>
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-4">
                        <button
                          type="button"
                          onClick={() => openDetails(book)}
                          className="font-medium text-primary-600 hover:text-primary-700 hover:underline text-left"
                        >
                          {getLocalized(book.title, book.titleTranslations, lang)}
                        </button>
                      </td>
                      <td className="py-2 px-4 text-gray-700">
                        {getLocalized(book.author, book.authorTranslations, lang)}
                      </td>
                      <td className="py-2 px-4 text-gray-600 hidden sm:table-cell">
                        {getLocalized(book.category, book.categoryTranslations, lang)}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600 tabular-nums">
                        {book.publishYear}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600 tabular-nums">
                        {book.pages || '—'}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(book)}
                          disabled={deletingId !== null}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('user.books.table.delete')}
                        >
                          {deletingId === book.id ? (
                            <span className="text-xs">{t('user.books.deleting')}</span>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
              <p className="text-sm text-gray-600">
                {t('user.books.pagination.total', { count: total })}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="per-page" className="text-sm text-gray-600 whitespace-nowrap">
                    {t('user.books.pagination.perPage')}
                  </label>
                  <select
                    id="per-page"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white"
                  >
                    {[10, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm text-gray-600">
                  {t('user.books.pagination.pageOf', {
                    current: page + 1,
                    total: totalPages,
                  })}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('user.books.pagination.prev')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('user.books.pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserBooksPage;
