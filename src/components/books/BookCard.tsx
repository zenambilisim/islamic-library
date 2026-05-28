'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Download, Eye, Loader2 } from 'lucide-react';
import type { Book } from '@/types';
import { useBookModal } from '@/contexts/BookModalContext';
import { downloadBookAsset, safeDownloadBasename } from '@/lib/download-book-file';
import { isUnknownAuthorDisplayName, resolveAuthorDisplayName } from '@/lib/author-display-name';

interface BookCardProps {
  book: Book;
  /** Ana sayfa kataloğu için sade kart */
  variant?: 'default' | 'compact';
}

const BookCard: React.FC<BookCardProps> = ({ book, variant = 'default' }) => {
  const { openDetails, openReader } = useBookModal();
  const { t } = useTranslation();
  const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({});
  const authorTrimmed = book.author?.trim() ?? '';
  const showAuthorRow = Boolean(authorTrimmed);
  const useAuthorForDownload = showAuthorRow && !isUnknownAuthorDisplayName(book.author);

  const handleFormatDownload = async (e: React.MouseEvent, format: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    const base = safeDownloadBasename(book.title, useAuthorForDownload ? book.author : undefined);
    const fileName = `${base}.${format.toLowerCase()}`;
    setDownloadLoading((s) => ({ ...s, [format]: true }));
    try {
      await downloadBookAsset(url, fileName, { bookId: book.id, format });
    } catch (err) {
      console.error(err);
      alert(t('errors.downloadFailed') || 'İndirme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setDownloadLoading((s) => ({ ...s, [format]: false }));
    }
  };

  if (variant === 'compact') {
    return (
      <article
        className="group flex cursor-pointer flex-col gap-2.5 transition-transform duration-300 hover:-translate-y-1"
        onClick={() => openDetails(book)}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] shadow-card transition-shadow group-hover:shadow-lift">
          <img
            src={book.coverImage || '/placeholder-book.svg'}
            alt={book.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-book.svg';
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openReader(book);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elev)] px-3 py-1.5 text-xs font-semibold text-ink"
            >
              <Eye size={14} />
              {t('common.read')}
            </button>
          </div>
        </div>
        <div className="px-0.5">
          <h3 className="font-display line-clamp-2 text-[15px] font-medium leading-snug tracking-tight text-ink">
            {book.title}
          </h3>
          {showAuthorRow && (
            <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
              {resolveAuthorDisplayName(book.author, t)}
            </p>
          )}
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            <span className="line-clamp-1">{book.category}</span>
            {book.pages > 0 && (
              <>
                <span className="h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                <span className="shrink-0 tabular-nums">
                  {book.pages.toLocaleString()} {t('book.pagesShort', 's.')}
                </span>
              </>
            )}
          </p>
        </div>
      </article>
    );
  }

  return (
    <div
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
      onClick={() => openDetails(book)}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[var(--surface-2)]">
        <img
          src={book.coverImage || '/placeholder-book.svg'}
          alt={book.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-book.svg';
          }}
        />
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openReader(book);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            <Eye size={16} />
            {t('common.read')}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <h3 className="font-display mb-2 line-clamp-2 text-lg font-medium leading-snug text-ink">
          {book.title}
        </h3>

        <div
          className={`mb-3 flex min-h-[2.5rem] items-start gap-3 ${showAuthorRow ? 'justify-between' : 'justify-end'}`}
        >
          {showAuthorRow && (
            <p className="line-clamp-2 flex-1 text-sm text-ink-muted">
              {resolveAuthorDisplayName(book.author, t)}
            </p>
          )}
          <p className="line-clamp-2 shrink-0 text-right text-xs text-ink-faint">{book.category}</p>
        </div>

        {book.pages > 0 && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-ink-muted">
            <BookOpen size={14} className="shrink-0 text-accent" aria-hidden />
            <span>
              {book.pages.toLocaleString()} {t('book.pages')}
            </span>
          </div>
        )}

        <p className="line-clamp-3 min-h-[4rem] text-sm leading-relaxed text-ink-muted">
          {book.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {Object.entries(book.formats).map(
            ([format, url]) =>
              url && (
                <button
                  key={format}
                  type="button"
                  disabled={!!downloadLoading[format]}
                  onClick={(e) => void handleFormatDownload(e, format, url)}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/15 disabled:cursor-wait disabled:opacity-60"
                >
                  {downloadLoading[format] ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  <span>{format.toUpperCase()}</span>
                </button>
              ),
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
