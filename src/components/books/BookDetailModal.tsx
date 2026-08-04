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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="max-h-screen w-full max-w-4xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-lift">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-elev)] px-6 py-4">
          <h2 className="min-w-0 truncate font-display text-xl font-semibold text-ink">
            {t('book.details')}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <ShareBookLinkButton
              bookId={book.id}
              bookSlug={book.slug}
              bookLanguage={book.language}
              bookTitle={book.title}
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
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
