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
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer transform hover:-translate-y-2 border border-gray-100" onClick={() => onViewDetails(book)}>
      {/* Book Cover */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"></div>
        <img
          src={book.coverImage || '/placeholder-book.svg'}
          alt={getLocalizedText(book.titleTranslations, book.title)}
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-book.svg';
          }}
        />
        
        {/* Download Count Badge */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
          {book.downloadCount.toLocaleString()} ⬇
        </div>
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-4">
          <div className="flex space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReadOnline(book);
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
      <div className="p-6">
        {/* Title */}
        <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {getLocalizedText(book.titleTranslations, book.title)}
        </h3>

        {/* Author & Category */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-gray-600">
            <User size={16} className="mr-2 text-primary-500" />
            <span className="text-sm font-medium">{getLocalizedText(book.authorTranslations, book.author)}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <FileText size={14} className="mr-1" />
            <span className="text-xs">{getLocalizedText(book.categoryTranslations, book.category)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
          <div className="flex items-center text-gray-600">
            <Calendar size={14} className="mr-1 text-blue-500" />
            <span className="text-sm font-medium">{book.publishYear}</span>
          </div>
          <div className="text-sm font-medium text-purple-600">
            {book.pages} sayfa
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {book.fileSize}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {getLocalizedText(book.descriptionTranslations, book.description)}
        </p>

        {/* Download formats */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(book.formats).map(([format, url]) => (
            url && (
              <a
                key={format}
                href={url}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-primary-100 to-purple-100 hover:from-primary-200 hover:to-purple-200 text-primary-700 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-1 transform hover:scale-105 shadow-sm"
                download
              >
                <Download size={12} />
                <span>{format.toUpperCase()}</span>
              </a>
            )
          ))}
        </div>

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {book.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
              {book.tags.length > 3 && (
                <span className="text-xs text-gray-500 font-medium">+{book.tags.length - 3} etiket</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
