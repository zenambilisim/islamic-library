'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, FolderOpen, CheckCircle, XCircle } from 'lucide-react';
import { parseFolderFiles, type BookEntry } from '@/lib/bulkUploadUtils';

const BulkUploadPage = () => {
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const parsed = parseFolderFiles(list);
    setEntries(parsed);
    setSelected(new Set(parsed.map((_, i) => i)));
    setResult(null);
    e.target.value = '';
  };

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const uploadOne = async (entry: BookEntry): Promise<string | null> => {
    let description = '';
    if (entry.files.rtf) {
      const form = new FormData();
      form.append('file', entry.files.rtf);
      const res = await fetch('/api/rtf-to-text', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        description = data.text || '';
      }
    }

    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: entry.title,
        author: entry.author,
        category: entry.categorySlug,
        description: description || undefined,
        language: 'en',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    const bookId = data.book?.id;
    if (!bookId) throw new Error('Kitap oluşturuldu ama id alınamadı');

    const coverFile = entry.files.cover!;
    const coverForm = new FormData();
    coverForm.append('file', coverFile);
    coverForm.append('filename', coverFile.name);
    const coverRes = await fetch(`/api/books/${bookId}/cover`, { method: 'POST', body: coverForm });
    if (!coverRes.ok) {
      const coverData = await coverRes.json().catch(() => ({}));
      throw new Error(coverData.error || 'Kapak yüklenemedi');
    }

    const uploadFile = async (file: File, format: string) => {
      const form = new FormData();
      form.append('file', file);
      form.append('format', format);
      form.append('filename', file.name);
      const r = await fetch(`/api/books/${bookId}/files`, { method: 'POST', body: form });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `${format} yüklenemedi`);
      }
    };
    await uploadFile(entry.files.pdf!, 'pdf');
    if (entry.files.epub) await uploadFile(entry.files.epub, 'epub');
    if (entry.files.docx) await uploadFile(entry.files.docx, 'docx');

    return null;
  };

  const handleUpload = async () => {
    const toUpload = entries.filter((_, i) => selected.has(i));
    if (toUpload.length === 0) return;
    setUploading(true);
    setResult(null);
    const errors: string[] = [];
    let ok = 0;
    setProgress({ current: 0, total: toUpload.length });
    for (let i = 0; i < toUpload.length; i++) {
      setProgress({ current: i + 1, total: toUpload.length });
      try {
        const err = await uploadOne(toUpload[i]);
        if (err) errors.push(`${toUpload[i].title}: ${err}`);
        else ok++;
      } catch (e) {
        errors.push(`${toUpload[i].title}: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
      }
    }
    setResult({ ok, fail: toUpload.length - ok, errors });
    setUploading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Klasörden toplu kitap yükle</h1>
      <p className="text-gray-600 mb-6">
        Script ile aynı yapı: Kategori klasörleri altında &quot;Kitap Adı - Yazar&quot; klasörleri; her birinde PDF, kapak resmi ve isteğe bağlı RTF, EPUB, DOCX.
      </p>

      <input
        ref={inputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        accept=".pdf,.epub,.docx,.doc,.rtf,.png,.jpg,.jpeg"
        onChange={handleFolderChange}
        className="hidden"
      />

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <FolderOpen size={20} />
          Klasör seç
        </button>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || selected.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Upload size={20} />
            {uploading ? `Yükleniyor (${progress.current}/${progress.total})...` : `${selected.size} kitabı yükle`}
          </button>
        )}
        <Link
          href="/user/books"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Kitaplara dön
        </Link>
      </div>

      {result && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="font-medium text-gray-800">
            <CheckCircle className="inline text-green-600 mr-1" size={18} />
            Başarılı: {result.ok}
          </p>
          {result.fail > 0 && (
            <p className="font-medium text-red-700">
              <XCircle className="inline mr-1" size={18} />
              Hata: {result.fail}
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
              {result.errors.slice(0, 10).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
              {result.errors.length > 10 && <li>... ve {result.errors.length - 10} hata daha</li>}
            </ul>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === entries.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(entries.map((_, i) => i)));
                        else setSelected(new Set());
                      }}
                    />
                  </th>
                  <th className="text-left py-2 px-3">Kategori</th>
                  <th className="text-left py-2 px-3">Başlık</th>
                  <th className="text-left py-2 px-3">Yazar</th>
                  <th className="text-left py-2 px-3">Dosyalar</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggle(i)}
                        disabled={uploading}
                      />
                    </td>
                    <td className="py-2 px-3 text-gray-600">{entry.categoryFolder}</td>
                    <td className="py-2 px-3 font-medium">{entry.title}</td>
                    <td className="py-2 px-3">{entry.author}</td>
                    <td className="py-2 px-3 text-gray-500">
                      PDF ✓ Kapak ✓
                      {entry.files.epub && ' EPUB ✓'}
                      {entry.files.docx && ' DOCX ✓'}
                      {entry.files.rtf && ' RTF ✓'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="py-2 px-4 text-sm text-gray-500 border-t border-gray-100">
            Toplam {entries.length} kitap bulundu. Yüklemek istediklerinizi işaretleyip &quot;Yükle&quot; butonuna tıklayın.
          </p>
        </div>
      )}

      {entries.length === 0 && !uploading && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-gray-500">
          Klasör seçmek için yukarıdaki &quot;Klasör seç&quot; butonuna tıklayın.
        </div>
      )}
    </div>
  );
};

export default BulkUploadPage;
