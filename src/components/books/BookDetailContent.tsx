'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Eye, FileText, User, Loader2 } from 'lucide-react';
import type { Book } from '@/types';
import { downloadBookAsset, safeDownloadBasename } from '@/lib/download-book-file';
import { useBookModal } from '@/contexts/BookModalContext';

/** Sunucudan gelen serileştirilmiş tarihler için */
export type BookDetailBook = Omit<Book, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

interface BookDetailContentProps {
  book: BookDetailBook;
}

const BookDetailContent = ({ book }: BookDetailContentProps) => {
  const { openReader } = useBookModal();
  const { t, i18n } = useTranslation();
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [readOnlineLoading, setReadOnlineLoading] = useState(false);

  useEffect(() => {
    setLoadingUrls({});
    setReadOnlineLoading(false);
  }, [book.id]);

  const locale = i18n.language;
  const hasKnownAuthor = book.author.trim().toLowerCase() !== 'unknown author';

  const handleReadOnline = async () => {
    setReadOnlineLoading(true);
    try {
      await openReader(book as Book);
    } finally {
      setReadOnlineLoading(false);
    }
  };

  const handleDownload = async (format: string, url: string) => {
    try {
      setLoadingUrls((prev) => ({ ...prev, [format]: true }));
      const base = safeDownloadBasename(book.title, book.author);
      await downloadBookAsset(url, `${base}.${format.toLowerCase()}`, {
        bookId: book.id,
        format,
      });
    } catch (error) {
      console.error('Download error:', error);
      alert(t('errors.downloadFailed'));
    } finally {
      setLoadingUrls((prev) => ({ ...prev, [format]: false }));
    }
  };

  const createdAt = toDate(book.createdAt);
  const updatedAt = toDate(book.updatedAt);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <img
            src={book.coverImage || '/placeholder-book.jpg'}
            alt={book.title}
            className="w-full max-w-sm mx-auto rounded-lg shadow-lg mb-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-book.jpg';
            }}
          />

          <div className="space-y-3">
            <button
              onClick={handleReadOnline}
              disabled={readOnlineLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {readOnlineLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t('book.openingReader')}</span>
                </>
              ) : (
                <>
                  <Eye size={20} />
                  <span>{t('common.readOnline')}</span>
                </>
              )}
            </button>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('book.formats')}:</p>
              {Object.entries(book.formats).map(
                ([format, url]) =>
                  url && (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleDownload(format, url)}
                      disabled={loadingUrls[format]}
                      className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {loadingUrls[format] ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>{t('book.preparingDownload')}</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>
                            {t('common.download')} {format.toUpperCase()}
                          </span>
                        </>
                      )}
                    </button>
                  )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{book.title}</h1>

          {hasKnownAuthor && (
            <div className="flex items-center text-lg text-gray-600 mb-4">
              <User size={20} className="mr-2" />
              <span>{book.author}</span>
            </div>
          )}
          <div className="flex items-center text-lg text-gray-600 mb-4">
            <FileText size={20} className="mr-2" />
            <span>
              {t('book.category')}: {book.category}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('book.description')}</h3>
          <p className="text-gray-700 leading-relaxed">{book.description}</p>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('book.publicationInfo')}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">{t('book.dateAdded')}:</span>{' '}
              {createdAt.toLocaleDateString(locale)}
            </p>
            <p>
              <span className="font-medium">{t('book.lastUpdated')}:</span>{' '}
              {updatedAt.toLocaleDateString(locale)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailContent;
