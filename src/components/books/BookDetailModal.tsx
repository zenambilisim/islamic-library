import { useTranslation } from 'react-i18next';
import { X, Download, Eye, Star, Calendar, FileText, User, Hash, Globe } from 'lucide-react';
import type { Book } from '../../types';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onReadOnline: (book: Book) => void;
}

const BookDetailModal = ({ book, isOpen, onClose, onReadOnline }: BookDetailModalProps) => {
  const { t, i18n } = useTranslation();
  
  if (!isOpen || !book) return null;

  const currentLang = i18n.language as keyof typeof book.titleTranslations;

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  const formatRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
                    onClick={() => onReadOnline(book)}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Eye size={20} />
                    <span>{t('common.readOnline')}</span>
                  </button>

                  {/* Download Buttons */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">{t('book.formats')}:</p>
                    {Object.entries(book.formats).map(([format, url]) => (
                      url && (
                        <a
                          key={format}
                          href={url}
                          download={`${book.title}.${format}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          <Download size={16} />
                          <span>{t('common.download')} {format.toUpperCase()}</span>
                        </a>
                      )
                    ))}
                  </div>

                  {/* File Info */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('book.fileSize')}:</span>
                      <span className="font-medium">{book.fileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('book.downloads')}:</span>
                      <span className="font-medium">{book.downloadCount.toLocaleString()}</span>
                    </div>
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

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">

                  <span className="text-gray-500">({book.downloadCount.toLocaleString()} {t('book.downloads').toLowerCase()})</span>
                </div>
              </div>

              {/* Book Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <FileText size={18} className="mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600 text-sm">{t('book.category')}</span>
                    <p className="font-medium">{getLocalizedText(book.categoryTranslations, book.category)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar size={18} className="mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600 text-sm">{t('book.publishYear')}</span>
                    <p className="font-medium">{book.publishYear}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Hash size={18} className="mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600 text-sm">{t('book.pages')}</span>
                    <p className="font-medium">{book.pages}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Globe size={18} className="mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600 text-sm">{t('common.language')}</span>
                    <p className="font-medium capitalize">{book.language}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('book.description')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {getLocalizedText(book.descriptionTranslations, book.description)}
                </p>
              </div>

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('book.tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
