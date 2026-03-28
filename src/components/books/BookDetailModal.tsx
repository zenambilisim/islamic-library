'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Eye, FileText, User, Loader2 } from 'lucide-react';
import type { Book } from '@/types';
import { downloadBookAsset, safeDownloadBasename } from '@/lib/download-book-file';
import { useBookModal } from '@/contexts/BookModalContext';

const BookDetailModal = () => {
  const { selectedBook: book, closeDetails, openReader } = useBookModal();
  const isOpen = !!book;
  const onClose = closeDetails;
  const { t, i18n } = useTranslation();
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [readOnlineLoading, setReadOnlineLoading] = useState(false);

  // Reset URLs when modal opens with new book
  useEffect(() => {
    if (isOpen && book) {
      setLoadingUrls({});
      setReadOnlineLoading(false);
    }
  }, [isOpen, book?.id]);

  const handleReadOnline = async () => {
    if (!book) return;
    setReadOnlineLoading(true);
    try {
      await openReader(book);
    } finally {
      setReadOnlineLoading(false);
    }
  };

  if (!isOpen || !book) return null;

  const currentLang = i18n.language as keyof typeof book.titleTranslations;

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = async (format: string, url: string) => {
    try {
      setLoadingUrls((prev) => ({ ...prev, [format]: true }));
      const base = safeDownloadBasename(getLocalizedText(book.titleTranslations, book.title));
      await downloadBookAsset(url, `${base}.${format.toLowerCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      alert(t('errors.downloadFailed') || 'İndirme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoadingUrls((prev) => ({ ...prev, [format]: false }));
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{t('book.details')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Cover & Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Cover Image */}
                <img
                  src={book.coverImage || '/placeholder-book.jpg'}
                  alt={getLocalizedText(book.titleTranslations, book.title)}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-lg mb-6"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-book.jpg';
                  }}
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleReadOnline}
                    disabled={readOnlineLoading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {readOnlineLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Açılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Eye size={20} />
                        <span>{t('common.readOnline')}</span>
                      </>
                    )}
                  </button>

                  {/* Download Buttons */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">{t('book.formats')}:</p>
                    {Object.entries(book.formats).map(([format, url]) => (
                      url && (
                        <button
                          key={format}
                          onClick={() => handleDownload(format, url)}
                          disabled={loadingUrls[format]}
                          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          {loadingUrls[format] ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Hazırlanıyor...</span>
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              <span>{t('common.download')} {format.toUpperCase()}</span>
                            </>
                          )}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="lg:col-span-2">
              {/* Title & Author */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {getLocalizedText(book.titleTranslations, book.title)}
                </h1>
                
                <div className="flex items-center text-lg text-gray-600 mb-4">
                  <User size={20} className="mr-2" />
                  <span>{getLocalizedText(book.authorTranslations, book.author)}</span>
                </div>
                <div className="flex items-center text-lg text-gray-600 mb-4">
                  <FileText size={20} className="mr-2" />
                  <span>{t('book.category')}: {getLocalizedText(book.categoryTranslations, book.category)}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('book.description')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {getLocalizedText(book.descriptionTranslations, book.description)}
                </p>
              </div>
              {/* Publication Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Yayın Bilgileri</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Eklenme Tarihi:</span> {new Date(book.createdAt).toLocaleDateString(currentLang)}</p>
                  <p><span className="font-medium">Son Güncelleme:</span> {new Date(book.updatedAt).toLocaleDateString(currentLang)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;
