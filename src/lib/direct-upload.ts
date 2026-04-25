export type DirectUploadFormat = 'pdf' | 'epub' | 'docx' | 'doc';

interface PresignResponse {
  uploadUrl: string;
  uploadMethod?: 'PUT' | 'POST';
  uploadHeaders?: Record<string, string>;
  filePath: string;
  publicUrl: string;
}

async function uploadViaPresign(file: File, presign: PresignResponse): Promise<void> {
  const headers: Record<string, string> = {
    ...(presign.uploadHeaders || {}),
  };
  if (!headers['Content-Type'] && file.type) {
    headers['Content-Type'] = file.type;
  }
  const uploadRes = await fetch(presign.uploadUrl, {
    method: presign.uploadMethod || 'PUT',
    headers,
    body: file,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '');
    throw new Error(text || `Upload failed (${uploadRes.status})`);
  }
}

export async function uploadBookFileDirect(bookId: string, file: File, format: DirectUploadFormat): Promise<void> {
  const presignRes = await fetch(`/api/books/${bookId}/files/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, filename: file.name }),
  });
  const presignData = (await presignRes.json().catch(() => ({}))) as Partial<PresignResponse> & { error?: string };
  if (!presignRes.ok || !presignData.uploadUrl || !presignData.filePath || !presignData.publicUrl) {
    throw new Error(presignData.error || 'Signed upload URL alınamadı');
  }

  await uploadViaPresign(file, presignData as PresignResponse);

  const completeRes = await fetch(`/api/books/${bookId}/files/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format,
      filePath: presignData.filePath,
      publicUrl: presignData.publicUrl,
      size: file.size,
      filename: file.name,
    }),
  });
  const completeData = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    throw new Error(completeData.error || `${format} kaydı tamamlanamadı`);
  }
}

export async function uploadBookCoverDirect(bookId: string, file: File): Promise<void> {
  const presignRes = await fetch(`/api/books/${bookId}/cover/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name }),
  });
  const presignData = (await presignRes.json().catch(() => ({}))) as Partial<PresignResponse> & { error?: string };
  if (!presignRes.ok || !presignData.uploadUrl || !presignData.filePath || !presignData.publicUrl) {
    throw new Error(presignData.error || 'Kapak için signed upload URL alınamadı');
  }

  await uploadViaPresign(file, presignData as PresignResponse);

  const completeRes = await fetch(`/api/books/${bookId}/cover/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath: presignData.filePath,
      publicUrl: presignData.publicUrl,
      size: file.size,
      filename: file.name,
    }),
  });
  const completeData = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    throw new Error(completeData.error || 'Kapak kaydı tamamlanamadı');
  }
}
