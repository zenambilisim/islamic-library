import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Eye, FileText, Calendar, User } from 'lucide-react';
import type { Book } from '../../types';

interface BookCardProps {
  book: Book;
  onViewDetails: (book: Book) => void;
  onReadOnline: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onViewDetails, onReadOnline }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as keyof typeof book.titleTranslations;

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  return (
    <div className="book-card group cursor-pointer" onClick={() => onViewDetails(book)}>
      {/* Book Cover */}
      <div className="relative overflow-hidden">
        <img
          src={book.coverImage || '/placeholder-book.svg'}
          alt={getLocalizedText(book.titleTranslations, book.title)}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-book.svg';
          }}
        />
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReadOnline(book);
              }}
              className="bg-white text-gray-900 px-3 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors flex items-center space-x-1"
            >
              <Eye size={16} />
              <span className="text-sm">{t('common.read')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {getLocalizedText(book.titleTranslations, book.title)}
        </h3>

        {/* Author */}
        <div className="flex items-center text-gray-600 mb-2">
          <User size={14} className="mr-2" />
          <span className="text-sm">{getLocalizedText(book.authorTranslations, book.author)}</span>
        </div>

        {/* Category */}
        <div className="flex items-center text-gray-600 mb-2">
          <FileText size={14} className="mr-2" />
          <span className="text-sm">{getLocalizedText(book.categoryTranslations, book.category)}</span>
        </div>

        {/* Publish Year & Pages */}
        <div className="flex items-center justify-between text-gray-500 text-sm mb-3">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{book.publishYear}</span>
          </div>
          <span>{book.pages} {t('book.pages').toLowerCase()}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {getLocalizedText(book.descriptionTranslations, book.description)}
        </p>

        {/* Book Info Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">({book.downloadCount.toLocaleString()} indirme)</span>
          </div>
          <span className="text-xs text-gray-500">{book.fileSize}</span>
        </div>

        {/* Download formats */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {Object.entries(book.formats).map(([format, url]) => (
              url && (
                <a
                  key={format}
                  href={url}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                  download
                >
                  <Download size={12} />
                  <span>{format.toUpperCase()}</span>
                </a>
              )
            ))}
          </div>
        </div>

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {book.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {book.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{book.tags.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
