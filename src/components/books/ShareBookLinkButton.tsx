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
  /** Kapak görseli — native paylaşımda eklenmeye çalışılır; OG için sayfa meta’sı kullanılır */
  coverImage?: string | null;
  /** Örn. modal: outline; sayfa: solid */
  variant?: 'outline' | 'solid';
  className?: string;
}

function resolveAbsoluteCover(coverImage: string): string | null {
  const trimmed = coverImage.trim();
  if (!trimmed || trimmed.includes('placeholder-book')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (typeof window === 'undefined') return null;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${window.location.origin}${path}`;
}

async function tryBuildCoverFile(coverImage: string | null | undefined): Promise<File | null> {
  if (!coverImage) return null;
  const abs = resolveAbsoluteCover(coverImage);
  if (!abs) return null;
  try {
    const res = await fetch(abs);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size < 32) return null;
    const ext = blob.type.includes('png')
      ? 'png'
      : blob.type.includes('webp')
        ? 'webp'
        : 'jpg';
    return new File([blob], `cover.${ext}`, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

export default function ShareBookLinkButton({
  bookId,
  bookSlug,
  bookLanguage = 'tr',
  bookTitle,
  coverImage,
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
      if (navigator.share) {
        const coverFile = await tryBuildCoverFile(coverImage);
        if (coverFile && navigator.canShare?.({ files: [coverFile] })) {
          try {
            await navigator.share({
              title,
              text: shareText,
              files: [coverFile],
            });
            return;
          } catch (e) {
            if ((e as Error).name === 'AbortError') return;
            // files+text bazı ortamlarda reddedilir; URL paylaşımına düş
          }
        }
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
