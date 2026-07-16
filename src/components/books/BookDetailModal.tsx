'use client';

import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useBookModal } from '@/contexts/BookModalContext';
import BookDetailContent from '@/components/books/BookDetailContent';
import ShareBookLinkButton from '@/components/books/ShareBookLinkButton';

const BookDetailModal = () => {
  const { selectedBook: book, closeDetails } = useBookModal();
  const isOpen = !!book;
  const onClose = closeDetails;
  const { t } = useTranslation();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center gap-3 z-10">
          <h2 className="text-xl font-bold text-gray-900 truncate min-w-0">{t('book.details')}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <ShareBookLinkButton
              bookId={book.id}
              bookSlug={book.slug}
              bookLanguage={book.language}
              bookTitle={book.title}
              coverImage={book.coverImage}
            />
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <BookDetailContent book={book} />
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;
