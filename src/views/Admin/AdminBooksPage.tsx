'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { BookPlus, FolderUp, Pencil, Trash2 } from 'lucide-react';
import type { Book, Language } from '@/types';
import { useAdminBooksPaginated } from '@/hooks/useAdminBooksPaginated';
import { useBookModal } from '@/contexts/BookModalContext';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { resolveAuthorDisplayName } from '@/lib/author-display-name';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSearchField from '@/components/admin/AdminSearchField';
import {
  adminAlertError,
  adminBtnDanger,
  adminBtnIcon,
  adminBtnIconDanger,
  adminBtnPrimary,
  adminBtnSecondary,
  adminEmptyState,
  adminLinkAccent,
  adminLoadingState,
  adminPaginationBar,
  adminSelect,
  adminSelectCompact,
  adminTableWrap,
  adminTd,
  adminTdPrimary,
  adminTh,
  adminTheadRow,
  adminTr,
} from '@/components/admin/admin-classes';

const DATA_LANGUAGES: Language[] = ['tr', 'en', 'ru', 'az'];

const AdminBooksPage = () => {
  const { t } = useTranslation();
  const { openDetails } = useBookModal();
  const [dataLanguage, setDataLanguage] = useState<Language>('tr');

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
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    selectedCategory,
    setSelectedCategory,
    refetch,
  } = useAdminBooksPaginated(20, dataLanguage);
  const { categories } = useSupabaseCategories(dataLanguage);

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

  useEffect(() => {
    if (selectedCategory && !categories.some((category) => category.slug === selectedCategory)) {
      setSelectedCategory('');
    }
  }, [categories, selectedCategory, setSelectedCategory]);

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
          t('admin.books.bulkDeletePartialError', {
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
      setDeleteError(err instanceof Error ? err.message : t('admin.books.bulkDeleteError'));
    } finally {
      setDeletingId(null);
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(t('admin.books.deleteConfirm'))) return;
    await deleteMany([book.id]);
  };

  const handleBulkDelete = async () => {
    const ids = books.filter((book) => selectedIds.has(book.id)).map((book) => book.id);
    if (ids.length === 0) return;
    if (!window.confirm(t('admin.books.bulkDeleteConfirm', { count: ids.length }))) return;
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
      <AdminShell>
        <div className={adminAlertError}>{error}</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <AdminPageHeader title={t('admin.books.title')}>
        {books.length > 0 && (
          <button
            type="button"
            onClick={() => void handleBulkDelete()}
            disabled={bulkDeleting || selectedIds.size === 0 || deletingId !== null}
            className={adminBtnDanger}
          >
            <Trash2 size={18} />
            {bulkDeleting
              ? t('admin.books.bulkDeleting')
              : t('admin.books.bulkDeleteButton', { count: selectedIds.size })}
          </button>
        )}
        <Link
          href="/admin/books/new"
          target="_blank"
          rel="noopener noreferrer"
          className={adminBtnPrimary}
        >
          <BookPlus size={18} />
          {t('admin.books.addNew')}
        </Link>
        <Link href="/admin/books/bulk" className={adminBtnSecondary}>
          <FolderUp size={18} />
          {t('admin.nav.bulkUpload')}
        </Link>
      </AdminPageHeader>

      {deleteError && <div className={adminAlertError}>{deleteError}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AdminSearchField
          id="admin-books-search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('admin.books.searchPlaceholder')}
          label={t('admin.books.searchLabel')}
        />
        <div className="min-w-[120px]">
          <label htmlFor="admin-books-data-language" className="sr-only">
            {t('common.language')}
          </label>
          <select
            id="admin-books-data-language"
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
        <div className="min-w-[220px]">
          <label htmlFor="admin-books-category" className="sr-only">
            {t('admin.books.categoryFilterLabel')}
          </label>
          <select
            id="admin-books-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={adminSelect}
          >
            <option value="">{t('admin.books.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={adminTableWrap}>
        {loading ? (
          <div className={adminLoadingState}>
            <span>{t('admin.books.loading')}</span>
          </div>
        ) : books.length === 0 ? (
          <div className={adminEmptyState}>
            {debouncedSearch ? t('admin.books.noBooksMatch') : t('admin.books.noBooks')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className={adminTheadRow}>
                    <th className={`${adminTh} w-10`}>
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        disabled={bulkDeleting || deletingId !== null || books.length === 0}
                        aria-label={t('admin.books.selectAll')}
                      />
                    </th>
                    <th className={`${adminTh} w-16`}>{t('admin.books.table.cover')}</th>
                    <th className={adminTh}>{t('admin.books.table.title')}</th>
                    <th className={adminTh}>{t('admin.books.table.author')}</th>
                    <th className={`${adminTh} hidden sm:table-cell`}>{t('admin.books.table.category')}</th>
                    <th className={`${adminTh} text-right w-20`}>{t('admin.books.table.pages')}</th>
                    <th className={`${adminTh} text-right w-32`}>{t('admin.books.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book: Book) => (
                    <tr key={book.id} className={adminTr}>
                      <td className={adminTd}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(book.id)}
                          onChange={(e) => toggleSelectOne(book.id, e.target.checked)}
                          disabled={bulkDeleting || deletingId !== null}
                          aria-label={t('admin.books.selectOne', { title: book.title })}
                        />
                      </td>
                      <td className={adminTd}>
                        <button
                          type="button"
                          onClick={() => openDetails(book)}
                          className="relative block h-14 w-10 shrink-0 overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] focus:outline-none focus:border-accent"
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
                            <span className="flex h-full w-full items-center justify-center text-xs text-ink-faint">—</span>
                          )}
                        </button>
                      </td>
                      <td className={adminTdPrimary}>
                        <button
                          type="button"
                          onClick={() => openDetails(book)}
                          className={`${adminLinkAccent} text-left`}
                        >
                          {book.title}
                        </button>
                      </td>
                      <td className={adminTd}>{resolveAuthorDisplayName(book.author, t)}</td>
                      <td className={`${adminTd} hidden sm:table-cell`}>{book.category}</td>
                      <td className={`${adminTd} text-right tabular-nums`}>{book.pages || '—'}</td>
                      <td className={`${adminTd} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/books/${book.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={adminBtnIcon}
                            title={t('admin.books.table.edit')}
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(book)}
                            disabled={bulkDeleting || deletingId !== null}
                            className={adminBtnIconDanger}
                            title={t('admin.books.table.delete')}
                          >
                            {deletingId === book.id ? (
                              <span className="text-xs">{t('admin.books.deleting')}</span>
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
            <div className={adminPaginationBar}>
              <p className="text-sm text-ink-muted">
                {t('admin.books.pagination.total', { count: total })}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="per-page" className="whitespace-nowrap text-sm text-ink-muted">
                    {t('admin.books.pagination.perPage')}
                  </label>
                  <select
                    id="per-page"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className={adminSelectCompact}
                  >
                    {[10, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm text-ink-muted">
                  {t('admin.books.pagination.pageOf', {
                    current: page + 1,
                    total: totalPages,
                  })}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className={adminBtnSecondary}
                  >
                    {t('admin.books.pagination.prev')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className={adminBtnSecondary}
                  >
                    {t('admin.books.pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminBooksPage;
