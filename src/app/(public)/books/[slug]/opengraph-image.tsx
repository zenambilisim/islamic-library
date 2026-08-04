import { ImageResponse } from 'next/og';
import { getBookForPublicPage } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';
import { loadCoverDataUrl } from '@/lib/og-cover';
import { SITE_NAME } from '@/lib/seo';

export const runtime = 'nodejs';
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { book: raw } = await getBookForPublicPage(slug);
  const model = raw ? convertSupabaseBookToBook(raw) : null;

  const title = model?.title?.trim() || 'Kitap';
  const author =
    model?.authors?.filter(Boolean).join(', ') ||
    model?.author?.trim() ||
    '';
  const coverData = model
    ? await loadCoverDataUrl(raw?.cover_image_url ?? model.coverImage)
    : null;

  const titleSize = title.length > 60 ? 42 : title.length > 36 ? 48 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0D5F58 0%, #134E4A 55%, #14191E 100%)',
          padding: 48,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            borderRadius: 24,
            background: 'rgba(247, 245, 240, 0.96)',
            padding: 40,
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 280,
              height: 420,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#D9F0EC',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 40px rgba(20, 25, 30, 0.28)',
            }}
          >
            {coverData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverData}
                alt=""
                width={280}
                height={420}
                style={{
                  width: 280,
                  height: 420,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  color: '#0F766E',
                  fontSize: 28,
                  fontWeight: 700,
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                {SITE_NAME}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              gap: 20,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#0F766E',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                display: 'flex',
                color: '#14191E',
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.2,
                maxHeight: 220,
                overflow: 'hidden',
              }}
            >
              {title}
            </div>
            {author ? (
              <div
                style={{
                  display: 'flex',
                  color: '#5A6168',
                  fontSize: 28,
                  fontWeight: 500,
                }}
              >
                {author}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                marginTop: 12,
                color: '#0D5F58',
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              Ücretsiz oku · Islamic Library
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
