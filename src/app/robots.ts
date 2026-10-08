import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/lib/site-url';
import { SUPPORTED_LANGS, localizedPath } from '@/lib/locale';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseUrl();
  const libraryPaths = SUPPORTED_LANGS.map((l) => localizedPath(l, '/library'));

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/storage/'],
        // /api/storage/ açık: WhatsApp/Telegram OG crawler’ları kapak görseline erişebilsin
        disallow: ['/admin/', '/user/', '/library', ...libraryPaths, '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
