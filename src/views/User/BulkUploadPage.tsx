'use client';

import { useState, useRef, useEffect, type InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { Upload, FolderOpen, CheckCircle, XCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import type { Category, Language } from '@/types';
import {
  parseFolderFilesWithSelection,
  applyAuthorTxtOverrides,
  splitBulkAuthorNames,
  type BookEntry,
} from '@/lib/bulkUploadUtils';
import { uploadBookCoverDirect, uploadBookFileDirect } from '@/lib/direct-upload';

const LANGUAGES: Language[] = ['en', 'tr', 'ru', 'az'];

async function countPdfPagesFromFile(file: File): Promise<number | null> {
  try {
    const buffer = await file.arrayBuffer();
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

const BulkUploadPage = () => {
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);
  const [language, setLanguage] = useState<Language | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFolderFilesRef = useRef<File[] | null>(null);
  const { categories, loading: categoriesLoading } = useSupabaseCategories(language || undefined);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;

  const applyParsed = (parsed: BookEntry[]) => {
    setEntries(parsed);
    setSelected(new Set(parsed.map((_, i) => i)));
  };

  useEffect(() => {
    const list = lastFolderFilesRef.current;
    if (!list?.length || !language || !selectedCategory) return;
    void (async () => {
      const parsed = parseFolderFilesWithSelection(list, {
        language,
        categoryName: selectedCategory.name,
        categoryIdOrSlug: selectedCategory.id,
      });
      await applyAuthorTxtOverrides(parsed);
      applyParsed(parsed);
      setResult(null);
    })();
  }, [language, selectedCategory]);

  useEffect(() => {
    setCategoryId('');
    setEntries([]);
    setSelected(new Set());
    lastFolderFilesRef.current = null;
    setResult(null);
  }, [language]);

  useEffect(() => {
    setEntries([]);
    setSelected(new Set());
    lastFolderFilesRef.current = null;
    setResult(null);
  }, [categoryId]);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!language || !selectedCategory) {
      e.target.value = '';
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    lastFolderFilesRef.current = list;
    void (async () => {
      const parsed = parseFolderFilesWithSelection(list, {
        language,
        categoryName: selectedCategory.name,
        categoryIdOrSlug: selectedCategory.id,
      });
      await applyAuthorTxtOverrides(parsed);
      applyParsed(parsed);
      setSelected(new Set(parsed.map((_, i) => i)));
      setResult(null);
    })();
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
    if (!language) {
      throw new Error('Dil seçilmedi');
    }

    let description = '';
    const descFile = entry.files.txt;
    if (descFile) {
      const form = new FormData();
      form.append('file', descFile);
      const res = await fetch('/api/rtf-to-text', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        description = data.text || '';
      }
    }

    const authorNames = splitBulkAuthorNames(entry.author);
    if (authorNames.length === 0) {
      throw new Error('Yazar bilgisi yok (klasör adı veya author.txt)');
    }

    const pages = await countPdfPagesFromFile(entry.files.pdf!);

    const createBookPayload: {
      title: string;
      authors: { name: string }[];
      category_id: string;
      description?: string;
      language: Language;
      pages?: number;
    } = {
      title: entry.title,
      authors: authorNames.map((name) => ({ name })),
      category_id: categoryId,
      description: description || undefined,
      language,
    };
    if (pages != null) {
      createBookPayload.pages = pages;
    }

    console.log('[BulkUpload] create book payload (with pages):', createBookPayload);

    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBookPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    const bookId = data.book?.id;
    if (!bookId) throw new Error('Kitap oluşturuldu ama id alınamadı');

    const coverFile = entry.files.cover!;
    await uploadBookCoverDirect(bookId, coverFile);

    const uploadFile = async (file: File, format: string) => {
      await uploadBookFileDirect(bookId, file, format as 'pdf' | 'epub' | 'docx');
    };
    await uploadFile(entry.files.pdf!, 'pdf');
    if (entry.files.epub) await uploadFile(entry.files.epub, 'epub');
    if (entry.files.docx) await uploadFile(entry.files.docx, 'docx');

    return null;
  };

  const handleUpload = async () => {
    if (!language || !categoryId) return;
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
      <div className="text-gray-600 mb-6">
        <ul className="list-disc list-inside space-y-1">
          <li>Dili seçin.</li>
          <li>Kategoriyi seçin.</li>
          <li>Kitap klasörünü seçin.</li>
          <li>
            Her kitap klasörü <code className="text-xs bg-gray-100 px-1 rounded">Kitap Adı - Yazar</code> formatında
            olmalı ve içinde en az <code className="text-xs bg-gray-100 px-1 rounded">.pdf</code> ile{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">.png</code> bulunmalı.
          </li>
        </ul>
      </div>

      <div className="mb-3 text-sm">
        <label htmlFor="bulk-lang" className="block text-gray-700 mb-1">
          Dil:
        </label>
        <select
          id="bulk-lang"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          disabled={uploading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900"
        >
          <option value="">Dil seçin</option>
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 text-sm">
        <label htmlFor="bulk-category" className="block text-gray-700 mb-1">
          Kategori:
        </label>
        <select
          id="bulk-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={uploading || !language || categoriesLoading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 min-w-52"
        >
          <option value="">
            {!language ? 'Önce dil seçin' : categoriesLoading ? 'Kategoriler yükleniyor...' : 'Kategori seçin'}
          </option>
          {categories.map((c: Category) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={inputRef}
        type="file"
        {...({
          webkitdirectory: "",
          directory: "",
        } as InputHTMLAttributes<HTMLInputElement>)}
        multiple
        accept=".pdf,.epub,.doc,.docx,.txt,.png"
        onChange={handleFolderChange}
        className="hidden"
      />

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !language || !categoryId}
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
                  <th className="text-left py-2 px-3">Dil</th>
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
                    <td className="py-2 px-3 text-gray-600 font-mono text-xs">{language.toUpperCase()}</td>
                    <td className="py-2 px-3 text-gray-600">{selectedCategory?.name || entry.categoryFolder}</td>
                    <td className="py-2 px-3 font-medium">{entry.title}</td>
                    <td className="py-2 px-3">{entry.author}</td>
                    <td className="py-2 px-3 text-gray-500">
                      PDF ✓ PNG ✓
                      {entry.files.epub && ' EPUB ✓'}
                      {entry.files.docx && ' Word ✓'}
                      {entry.files.rtf && ' RTF ✓'}
                      {entry.files.txt && ' TXT ✓'}
                      {entry.files.authorTxt && ' author.txt ✓'}
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
