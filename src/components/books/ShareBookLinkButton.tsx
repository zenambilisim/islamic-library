'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Loader2, Check } from 'lucide-react';

interface ShareBookLinkButtonProps {
  bookId: string;
  /** Varsa paylaşım URL’i `/books/{slug}?lang=` olur */
  bookSlug?: string | null;
  /** Slug ile birlikte dil (kitabın language_code değeri) */
  bookLanguage?: string;
  bookTitle?: string;
  /** Örn. modal: outline; sayfa: solid */
  variant?: 'outline' | 'solid';
  className?: string;
}

export default function ShareBookLinkButton({
  bookId,
  bookSlug,
  bookLanguage = 'tr',
  bookTitle,
  variant = 'outline',
  className = '',
}: ShareBookLinkButtonProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseClass =
    variant === 'solid'
      ? 'bg-primary-600 hover:bg-primary-700 text-white border-transparent'
      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200';

  const handleClick = async () => {
    if (typeof window === 'undefined') return;
    const hasSlug = Boolean(bookSlug?.trim());
    const pathSeg = hasSlug
      ? encodeURIComponent(bookSlug!.trim())
      : encodeURIComponent(bookId);
    const langQs = hasSlug ? `?lang=${encodeURIComponent(bookLanguage)}` : '';
    const url = `${window.location.origin}/books/${pathSeg}${langQs}`;
    const title = bookTitle?.trim() || document.title;
    const shareText = `${title}\n${url}`;

    setBusy(true);
    setCopied(false);
    try {
      // URL paylaş: kapak OG meta ile önizlenir; dosya paylaşımı sadece görsel gönderir, link olmaz
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        window.prompt(t('book.copyLinkHint'), url);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard?.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2200);
        } catch {
          alert(t('book.linkCopyFailed'));
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${baseClass} ${className}`}
      aria-label={t('book.shareLink')}
    >
      {busy ? (
        <Loader2 size={18} className="shrink-0 animate-spin" />
      ) : copied ? (
        <Check size={18} className="shrink-0 text-emerald-600" />
      ) : (
        <Link2 size={18} className="shrink-0" />
      )}
      <span>
        {copied ? t('book.linkCopied') : t('book.shareLink')}
      </span>
    </button>
  );
}
