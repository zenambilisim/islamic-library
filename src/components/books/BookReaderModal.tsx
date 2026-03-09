'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import type { Book } from '@/types';
import { getSignedBookFileUrl } from '@/lib/supabase';
import { useBookModal } from '@/contexts/BookModalContext';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (src: string | { url: string }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<unknown> }> };
    };
  }
}

function loadPdfJs(): Promise<typeof window.pdfjsLib> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        resolve(window.pdfjsLib);
      } else reject(new Error('pdfjsLib not found'));
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

const BookReaderModal = () => {
  const { readingBook: book, closeReader: onClose } = useBookModal();
  const isOpen = !!book;
  const { t, i18n } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown> } | null>(null);

  // Signed URL
  useEffect(() => {
    if (isOpen && book?.formats.pdf) {
      setIsLoading(true);
      setError('');
      getSignedBookFileUrl(book.formats.pdf, 3600)
        .then((url) => setPdfUrl(url))
        .catch((err) => {
          console.error('Error loading signed URL:', err);
          setError(t('common.error'));
          setIsLoading(false);
        });
    } else {
      setPdfUrl('');
      setNumPages(0);
      setPageNumber(1);
      pdfDocRef.current = null;
      setIsLoading(false);
    }
  }, [isOpen, book?.formats.pdf, t]);

  // PDF.js CDN + open document
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    loadPdfJs()
      .then((pdfjsLib) => {
        if (cancelled || !pdfjsLib) return;
        return pdfjsLib.getDocument(pdfUrl).promise;
      })
      .then((pdfDoc) => {
        if (cancelled || !pdfDoc) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setPageNumber(1);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError(t('common.error'));
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [pdfUrl, t]);

  // Render current page to canvas
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdfDoc || !canvas || pageNumber < 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    type PdfPage = { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } };
    pdfDoc
      .getPage(pageNumber)
      .then((page: unknown) => {
        const p = page as PdfPage;
        const viewport = p.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        return p.render({
          canvasContext: ctx,
          viewport,
        }).promise;
      })
      .catch((err) => {
        console.error('Page render error:', err);
        setError(t('common.error'));
      });
  }, [pageNumber, scale, numPages, t]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setPageNumber((p) => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setPageNumber((p) => Math.min(numPages, p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, numPages]);

  const toggleFullscreen = () => setIsFullscreen((v) => !v);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || !book) return null;

  const currentLang = i18n.language as keyof typeof book.titleTranslations;
  const getLocalizedText = (translations: Record<string, string>, fallback: string) =>
    translations[currentLang] || translations.tr || fallback;

  return (
    <div
      className={`fixed inset-0 bg-black ${isFullscreen ? 'bg-opacity-95' : 'bg-opacity-75'} z-50 flex items-center justify-center`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl flex flex-col ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl w-full max-h-[95vh]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - indirme / yeni sekme butonu yok */}
        <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center rounded-t-xl shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {getLocalizedText(book.titleTranslations, book.title)}
            </h2>
            <p className="text-sm text-gray-300 truncate">
              {getLocalizedText(book.authorTranslations, book.author)}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Normal boyut' : 'Tam ekran'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* PDF canvas alanı: min-full + fit-content ile hem ortalama hem scroll */}
        <div className="flex-1 min-h-0 bg-gray-100 p-4 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
                <p className="text-gray-600">{t('common.loading')}</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center py-12">
                <p className="text-red-600 mb-2">{error}</p>
                <p className="text-gray-600 text-sm">PDF yüklenirken bir hata oluştu.</p>
              </div>
            </div>
          )}
          {pdfUrl && !error && numPages > 0 && (
            <div className="min-w-full min-h-full w-fit h-fit flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="shadow-lg block"
              />
            </div>
          )}
          {!pdfUrl && !isLoading && !error && (
            <div className="flex items-center justify-center min-h-full">
              <p className="text-gray-600">PDF dosyası bulunamadı.</p>
            </div>
          )}
        </div>

        {/* Alt bar: sayfa ortada, zoom sağda */}
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center rounded-b-xl shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('common.previousPage') || 'Önceki sayfa'}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium tabular-nums min-w-[4rem] text-center">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('common.nextPage') || 'Sonraki sayfa'}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('common.zoomOut') || 'Uzaklaştır'}
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
              disabled={scale >= 2.5}
              className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('common.zoomIn') || 'Yakınlaştır'}
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReaderModal;
