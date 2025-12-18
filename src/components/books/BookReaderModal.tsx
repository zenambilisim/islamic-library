import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import type { Book } from '../../types';
import { getSignedBookFileUrl } from '../../lib/supabase';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BookReaderModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookReaderModal = ({ book, isOpen, onClose }: BookReaderModalProps) => {
  const { t, i18n } = useTranslation();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');

  // Load signed URL when modal opens
  useEffect(() => {
    if (isOpen && book?.formats.pdf) {
      setIsLoading(true);
      setError('');
      
      getSignedBookFileUrl(book.formats.pdf, 3600) // 1 saat geçerli
        .then(url => {
          setPdfUrl(url);
        })
        .catch(err => {
          console.error('Error loading signed URL:', err);
          setError(t('common.error'));
          setIsLoading(false);
        });
    } else {
      setPdfUrl('');
    }
  }, [isOpen, book?.formats.pdf, t]);

  if (!isOpen || !book) return null;

  const currentLang = i18n.language as keyof typeof book.titleTranslations;
  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
    setError('');
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError(t('common.error'));
    setIsLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevPage();
    if (e.key === 'ArrowRight') goToNextPage();
    if (e.key === 'Escape') onClose();
  };

  // Keyboard navigation
  useState(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown as any);
      return () => window.removeEventListener('keydown', handleKeyDown as any);
    }
  });

  return (
    <div
      className={`fixed inset-0 bg-black ${isFullscreen ? 'bg-opacity-95' : 'bg-opacity-75'} z-50 flex items-center justify-center`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-xl ${isFullscreen ? 'w-full h-full' : 'max-w-6xl w-full max-h-[95vh]'} flex flex-col`}>
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center rounded-t-xl">
          <div className="flex-1">
            <h2 className="text-lg font-semibold truncate">
              {getLocalizedText(book.titleTranslations, book.title)}
            </h2>
            <p className="text-sm text-gray-300 truncate">
              {getLocalizedText(book.authorTranslations, book.author)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg ml-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {pdfUrl ? (
            <div className="flex flex-col items-center">
              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-600">{t('common.loading')}</p>
                </div>
              )}
              
              {error && (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-2">{error}</p>
                  <p className="text-gray-600 text-sm">PDF yüklenirken bir hata oluştu.</p>
                </div>
              )}

              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error=""
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-2xl"
                />
              </Document>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">PDF dosyası bulunamadı.</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between rounded-b-xl">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Önceki Sayfa (←)"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="px-4 py-1 bg-gray-800 rounded-lg text-sm font-medium">
              <span className="text-white">{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sonraki Sayfa (→)"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Uzaklaştır"
            >
              <ZoomOut size={20} />
            </button>

            <div className="px-3 py-1 bg-gray-800 rounded-lg text-sm font-medium">
              {Math.round(scale * 100)}%
            </div>

            <button
              onClick={zoomIn}
              disabled={scale >= 2.0}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Yakınlaştır"
            >
              <ZoomIn size={20} />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Normal Boyut' : 'Tam Ekran'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookReaderModal;
