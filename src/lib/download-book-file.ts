import { getSignedBookFileUrl } from '@/lib/supabase';

export function safeDownloadBasename(title: string): string {
  return title.replace(/[/\\?%*:|"<>]/g, '_').trim().slice(0, 180) || 'kitap';
}

/** İmzalı URL ile dosyayı fetch edip tarayıcı indirme diyaloğu tetikler (yeni sekmede açmaz). */
export async function downloadBookAsset(sourceUrl: string, downloadFileName: string): Promise<void> {
  const signedUrl = await getSignedBookFileUrl(sourceUrl, 3600);
  if (!signedUrl) throw new Error('signed url empty');
  const res = await fetch(signedUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
