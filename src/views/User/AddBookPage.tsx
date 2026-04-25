'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category } from '@/types';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';
import { uploadBookCoverDirect, uploadBookFileDirect } from '@/lib/direct-upload';

function categoryDisplayName(cat: Category): string {
  return cat.name;
}

function sortLocaleForLanguage(lang: string): string {
  if (lang === 'tr') return 'tr';
  if (lang === 'ru') return 'ru';
  if (lang === 'az') return 'az';
  return 'en';
}

const LANGUAGES = ['tr', 'en', 'ru', 'az'] as const;

const AddBookPage = () => {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useSupabaseCategories();
  const { authors, loading: authorsLoading, error: authorsError, refetch: refetchAuthors } =
    useSupabaseAuthors();

  const [title, setTitle] = useState('');
  const authorRowIdRef = useRef(1);
  const [authorRows, setAuthorRows] = useState<{ id: number; authorId: string }[]>([
    { id: 0, authorId: '' },
  ]);
  /** Seçilen satırın categories.id — book_categories ile DB’ye bağlanır */
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [pages, setPages] = useState('');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descFileLoading, setDescFileLoading] = useState(false);

  const authorsSorted = [...authors].sort((a, b) =>
    a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
  );

  const authorsForLanguage = useMemo(
    () => authorsSorted.filter((a) => a.language === language),
    [authorsSorted, language]
  );

  useEffect(() => {
    authorRowIdRef.current = 1;
    setAuthorRows([{ id: 0, authorId: '' }]);
    setCategoryId('');
  }, [language]);

  const categoriesForLanguage = useMemo(
    () => categories.filter((c) => c.language === language),
    [categories, language]
  );

  const categoriesSorted = useMemo(() => {
    const loc = sortLocaleForLanguage(language);
    return [...categoriesForLanguage].sort((a, b) =>
      categoryDisplayName(a).localeCompare(categoryDisplayName(b), loc, {
        sensitivity: 'base',
      })
    );
  }, [categoriesForLanguage, language]);

  const handleDescriptionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDescFileLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/rtf-to-text', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dosya işlenemedi');
      }
      if (data.text != null) {
        setDescription((prev) => (prev.trim() ? prev.trim() + '\n\n' + data.text : data.text));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Açıklama dosyası okunamadı.');
    } finally {
      setDescFileLoading(false);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!language.trim()) {
      setError('Lütfen önce dil seçin.');
      return;
    }
    if (!title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    const authorsPayload = authorRows
      .map((row) => {
        const aid = row.authorId.trim();
        if (!aid) return null;
        const a = authorsForLanguage.find((x) => x.id === aid);
        if (!a) return null;
        return { name: a.name, author_id: aid };
      })
      .filter((x): x is { name: string; author_id: string } => x != null);
    if (authorsPayload.length === 0) {
      setError('En az bir yazar seçin.');
      return;
    }
    if (categoriesLoading) {
      setError('Kategoriler yükleniyor, lütfen bekleyin.');
      return;
    }
    if (categoriesSorted.length === 0) {
      setError(
        'Bu dil için veritabanında kategori yok. Önce Kategoriler’den aynı dilde kategori ekleyin.'
      );
      return;
    }
    if (!categoryId.trim()) {
      setError('Lütfen listeden bir kategori seçin.');
      return;
    }
    if (!authorsLoading && authorsForLanguage.length === 0) {
      setError('Önce en az bir yazar eklemeniz gerekir.');
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      authors: authorsPayload,
      description: description.trim() || undefined,
      language,
      pages: pages ? parseInt(pages, 10) : undefined,
    };
    payload.category_id = categoryId.trim();

    setSubmitting(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      const bookId = data.book?.id;
      if (!bookId) throw new Error('Kitap oluşturuldu ama id alınamadı.');

      if (coverFile) {
        await uploadBookCoverDirect(bookId, coverFile).catch((err) => {
          console.warn('Kapak yüklenemedi:', err instanceof Error ? err.message : err);
        });
      }

      const uploadFile = async (file: File, format: string) => {
        await uploadBookFileDirect(bookId, file, format as 'pdf' | 'epub' | 'docx').catch((err) => {
          console.warn(`${format} yüklenemedi:`, err instanceof Error ? err.message : err);
        });
      };
      if (pdfFile) await uploadFile(pdfFile, 'pdf');
      if (epubFile) await uploadFile(epubFile, 'epub');
      if (docFile) await uploadFile(docFile, 'docx');

      router.push('/user/books');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Kitap Ekle</h1>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label htmlFor="language" className="block text-sm font-semibold text-gray-800 mb-2">Dil *</label>
            <select
              id="language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Önce dil seçin</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {language && (
            <>
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Başlık *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kitap adı"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-semibold text-gray-800">Yazarlar *</label>
              <button
                type="button"
                disabled={authorsLoading || authorsForLanguage.length === 0}
                onClick={() =>
                  setAuthorRows((rows) => [
                    ...rows,
                    { id: authorRowIdRef.current++, authorId: '' },
                  ])
                }
                className="text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-40"
              >
                + Yazar ekle
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Sıra kitapta yazar listesinde korunur. Aynı yazarı iki kez seçmeyin.
            </p>
            {authorsError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p>{authorsError}</p>
                <button
                  type="button"
                  onClick={() => refetchAuthors()}
                  className="mt-2 text-sm font-medium text-red-800 underline hover:no-underline"
                >
                  Tekrar dene
                </button>
              </div>
            )}
            {authorsLoading ? (
              <select
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500"
              >
                <option>Yazarlar yükleniyor...</option>
              </select>
            ) : authorsForLanguage.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <p className="mb-2">Veritabanında henüz yazar yok. Kitap eklemek için önce yazar ekleyin.</p>
                <Link
                  href="/user/authors/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-700 underline hover:no-underline"
                >
                  Yeni yazar ekle →
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {authorRows.map((row, idx) => (
                  <li key={row.id} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500 w-6 shrink-0">{idx + 1}.</span>
                    <select
                      aria-label={`Yazar ${idx + 1}`}
                      value={row.authorId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setAuthorRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, authorId: id } : r))
                        );
                      }}
                      className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Yazar seçin</option>
                      {authorsForLanguage.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {authorRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setAuthorRows((rows) =>
                            rows.length <= 1 ? rows : rows.filter((r) => r.id !== row.id)
                          )
                        }
                        className="shrink-0 text-sm text-red-600 hover:text-red-800 px-2"
                      >
                        Kaldır
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Kategori *</label>
            <p className="text-xs text-gray-500 mb-2">
              Liste veritabanındaki kategorilerden gelir; seçilen kitap diliyle aynı dilde kayıtlı satırlar
              gösterilir.
            </p>
            {categoriesLoading ? (
              <p className="text-sm text-gray-600">Kategoriler yükleniyor…</p>
            ) : categoriesSorted.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <p className="mb-2">
                  Bu dil için henüz kategori yok. Kitap eklemek için önce veritabanında bu dilde en az bir kategori
                  oluşturun.
                </p>
                <Link
                  href="/user/categories/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-700 underline hover:no-underline"
                >
                  Yeni kategori ekle →
                </Link>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Kategori seçin</option>
                {categoriesSorted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryDisplayName(c)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kısa açıklama"
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">
                Veya açıklamayı Word (DOC, DOCX), RTF veya düz metin (TXT) dosyasından yükle
              </label>
              <input
                type="file"
                accept=".rtf,.doc,.docx,.txt,application/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleDescriptionFile}
                disabled={descFileLoading}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50 disabled:opacity-50"
              />
              {descFileLoading && <span className="text-xs text-gray-500">Yükleniyor...</span>}
            </div>
          </div>

          <div className="max-w-xs">
            <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-1">Sayfa sayısı</label>
            <input
              id="pages"
              type="number"
              min={0}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              PDF yüklendiğinde sayfa sayısı dosyadan okunup kaydedilir (şifreli veya bozuk PDF’lerde atlanabilir).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kapak resmi</label>
            <p className="text-xs text-gray-500 mb-1">PNG veya JPG</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kitap dosyaları (PDF, EPUB, DOC)</label>
            <div className="space-y-2">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50"
              />
              <input
                type="file"
                accept=".epub,application/epub+zip"
                onChange={(e) => setEpubFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50"
              />
              <input
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              disabled={
                submitting ||
                authorsLoading ||
                !!authorsError ||
                authorsForLanguage.length === 0
              }
              className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Ekleniyor...' : 'Kitap Ekle'}
            </button>
            <Link
              href="/user/books"
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Kitaplara dön
            </Link>
          </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddBookPage;
