import sharp from 'sharp';

export const COVER_WEBP_QUALITY = 80;

const CONVERTIBLE_EXTS = new Set(['png', 'jpg', 'jpeg']);

export function coverExtFromName(filename: string): string {
  const ext = filename.split('.').pop()?.trim().toLowerCase() || 'jpg';
  return ext === 'jpeg' ? 'jpg' : ext;
}

export function shouldConvertCoverToWebp(ext: string): boolean {
  return CONVERTIBLE_EXTS.has(ext.trim().toLowerCase());
}

export async function encodeCoverToWebp(payload: Buffer): Promise<Buffer> {
  return sharp(payload).webp({ quality: COVER_WEBP_QUALITY }).toBuffer();
}
