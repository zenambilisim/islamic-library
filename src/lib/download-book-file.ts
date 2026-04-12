import { getSignedBookFileUrl } from '@/lib/supabase';

const INVALID_FILENAME_CHARS = /[/\\?%*:|"<>]/g;

function sanitizeFilenameSegment(s: string, maxLen: number): string {
  return s.replace(INVALID_FILENAME_CHARS, '_').trim().slice(0, maxLen);
}

/** İndirilen dosya adı için güvenli taban: isteğe bağlı yazar ile "Başlık - Yazar". */
export function safeDownloadBasename(title: string, author?: string): string {
  const authorTrim = author?.trim();
  if (!authorTrim) {
    return sanitizeFilenameSegment(title, 180) || 'kitap';
  }
  const t = sanitizeFilenameSegment(title, 120);
  const a = sanitizeFilenameSegment(authorTrim, 80);
  const combined = t && a ? `${t} - ${a}` : t || a;
  return (combined || 'kitap').slice(0, 180);
}

function isSameOriginR2Proxy(url: string): boolean {
  const t = url.trim();
  if (t.startsWith('/api/storage/r2/')) return true;
  if (typeof window !== 'undefined' && t.startsWith('http')) {
    try {
      const u = new URL(t);
      return u.origin === window.location.origin && u.pathname.startsWith('/api/storage/r2/');
    } catch {
      return false;
    }
  }
  return false;
}

/** İmzalı veya aynı-origin proxy URL ile dosyayı fetch edip indirir. */
export async function downloadBookAsset(sourceUrl: string, downloadFileName: string): Promise<void> {
  const fetchUrl = isSameOriginR2Proxy(sourceUrl)
    ? sourceUrl.trim().split('?')[0]
    : await getSignedBookFileUrl(sourceUrl, 3600);
  if (!fetchUrl) throw new Error('signed url empty');
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${fetchUrl.slice(0, 120)}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
