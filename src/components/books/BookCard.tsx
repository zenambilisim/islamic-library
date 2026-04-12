'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Eye, FileText, User, Loader2 } from 'lucide-react';
import type { Book } from '@/types';
import { useBookModal } from '@/contexts/BookModalContext';
import { downloadBookAsset, safeDownloadBasename } from '@/lib/download-book-file';

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { openDetails, openReader } = useBookModal();
  const { t } = useTranslation();
  const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({});

  const handleFormatDownload = async (e: React.MouseEvent, format: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    const base = safeDownloadBasename(book.title);
    const fileName = `${base}.${format.toLowerCase()}`;
    setDownloadLoading((s) => ({ ...s, [format]: true }));
    try {
      await downloadBookAsset(url, fileName);
    } catch (err) {
      console.error(err);
      alert(t('errors.downloadFailed') || 'İndirme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setDownloadLoading((s) => ({ ...s, [format]: false }));
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer transform hover:-translate-y-2 border border-gray-100"
      onClick={() => openDetails(book)}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gray-100">
        <img
          src={book.coverImage || '/placeholder-book.svg'}
          alt={book.title}
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-book.svg';
          }}
        />

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-4">
          <div className="flex space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openReader(book);
              }}
              className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-primary-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg transform hover:scale-105"
            >
              <Eye size={16} />
              <span className="text-sm">{t('common.read')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book Info */}
      <div className="flex flex-1 flex-col min-h-0 p-6">
        {/* Title */}
        <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 min-h-[3.25rem] group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {book.title}
        </h3>

        {/* Author & Category */}
        <div className="flex min-h-[2.75rem] items-start justify-between gap-3 mb-3">
          <div className="flex min-w-0 flex-1 items-center text-gray-600">
            <User size={16} className="mr-2 shrink-0 text-primary-500" />
            <span className="line-clamp-2 text-sm font-medium">{book.author}</span>
          </div>
          <div className="flex max-w-[42%] shrink-0 items-center text-gray-600">
            <FileText size={14} className="mr-2 shrink-0" />
            <span className="line-clamp-2 text-right text-xs">{book.category}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 min-h-[4.5rem] leading-relaxed">
          {book.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {Object.entries(book.formats).map(([format, url]) => (
            url && (
              <button
                key={format}
                type="button"
                disabled={!!downloadLoading[format]}
                onClick={(e) => void handleFormatDownload(e, format, url)}
                className="bg-gradient-to-r from-primary-100 to-purple-100 hover:from-primary-200 hover:to-purple-200 disabled:opacity-60 disabled:cursor-wait text-primary-700 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-1 transform hover:scale-105 shadow-sm"
              >
                {downloadLoading[format] ? (
                  <Loader2 size={12} className="animate-spin shrink-0" />
                ) : (
                  <Download size={12} />
                )}
                <span>{format.toUpperCase()}</span>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
