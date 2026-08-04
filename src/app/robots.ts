import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/storage/'],
        // /api/storage/ açık: WhatsApp/Telegram OG crawler’ları kapak görseline erişebilsin
        disallow: ['/admin/', '/user/', '/library', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
