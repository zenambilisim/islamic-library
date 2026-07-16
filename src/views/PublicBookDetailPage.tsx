'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import type { BookDetailBook } from '@/components/books/BookDetailContent';
import BookDetailContent from '@/components/books/BookDetailContent';
import ShareBookLinkButton from '@/components/books/ShareBookLinkButton';

interface PublicBookDetailPageProps {
  book: BookDetailBook;
}

export default function PublicBookDetailPage({ book }: PublicBookDetailPageProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium text-sm transition-colors"
        >
          <ArrowLeft size={18} aria-hidden />
          {t('book.backToHome')}
        </Link>
        <ShareBookLinkButton
          bookId={book.id}
          bookSlug={book.slug}
          bookLanguage={book.language}
          bookTitle={book.title}
          coverImage={book.coverImage}
          variant="solid"
        />
      </div>

      <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <BookDetailContent book={book} />
        </div>
      </article>
    </div>
  );
}
