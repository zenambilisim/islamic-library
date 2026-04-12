import { PDFDocument } from 'pdf-lib';

/**
 * PDF ikilisinden sayfa sayısı. Şifreli / bozuk dosyalarda null döner.
 */
export async function countPdfPages(buffer: Buffer): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      capNumbers: true,
    });
    const n = doc.getPageCount();
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
