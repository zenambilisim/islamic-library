'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { BookPlus, FolderUp, Pencil, Trash2 } from 'lucide-react';
import type { Book } from '@/types';
import { useUserBooksPaginated } from '@/hooks/useUserBooksPaginated';
import { useBookModal } from '@/contexts/BookModalContext';

const UserBooksPage = () => {
  const { t } = useTranslation();
  const { openDetails } = useBookModal();

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const visibleIds = new Set(books.map((book) => book.id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (visibleIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [books]);

  const deleteMany = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    const isBulk = ids.length > 1;
    setDeleteError(null);
    setDeletingId(ids.length === 1 ? ids[0] : null);
    setBulkDeleting(isBulk);
    try {
      const res = await fetch('/api/books/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);

      const failedCount = Array.isArray(data.failed) ? data.failed.length : 0;
      if (failedCount > 0) {
        setDeleteError(
          t('user.books.bulkDeletePartialError', {
            deleted: Number(data.deleted) || 0,
            failed: failedCount,
          })
        );
      }

      await refetch();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('user.books.bulkDeleteError'));
    } finally {
      setDeletingId(null);
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(t('user.books.deleteConfirm'))) return;
    await deleteMany([book.id]);
  };

  const handleBulkDelete = async () => {
    const ids = books.filter((book) => selectedIds.has(book.id)).map((book) => book.id);
    if (ids.length === 0) return;
    if (!window.confirm(t('user.books.bulkDeleteConfirm', { count: ids.length }))) return;
    await deleteMany(ids);
  };

  const allOnPageSelected = books.length > 0 && books.every((book) => selectedIds.has(book.id));

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const book of books) {
        if (checked) next.add(book.id);
        else next.delete(book.id);
      }
      return next;
    });
  };

  const toggleSelectOne = (bookId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(bookId);
      else next.delete(bookId);
      return next;
    });
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
          {books.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting || selectedIds.size === 0 || deletingId !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              {bulkDeleting
                ? t('user.books.bulkDeleting')
                : t('user.books.bulkDeleteButton', { count: selectedIds.size })}
            </button>
          )}
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
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        disabled={bulkDeleting || deletingId !== null || books.length === 0}
                        aria-label={t('user.books.selectAll')}
                      />
                    </th>
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
                      {t('user.books.table.pages')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
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
                        <input
                          type="checkbox"
                          checked={selectedIds.has(book.id)}
                          onChange={(e) => toggleSelectOne(book.id, e.target.checked)}
                          disabled={bulkDeleting || deletingId !== null}
                          aria-label={t('user.books.selectOne', { title: book.title })}
                        />
                      </td>
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
                          {book.title}
                        </button>
                      </td>
                      <td className="py-2 px-4 text-gray-700">
                        {book.author}
                      </td>
                      <td className="py-2 px-4 text-gray-600 hidden sm:table-cell">
                        {book.category}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600 tabular-nums">
                        {book.pages || '—'}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/user/books/${book.id}/edit`}
                            className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 inline-flex"
                            title={t('user.books.table.edit')}
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(book)}
                            disabled={bulkDeleting || deletingId !== null}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('user.books.table.delete')}
                          >
                            {deletingId === book.id ? (
                              <span className="text-xs">{t('user.books.deleting')}</span>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
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
