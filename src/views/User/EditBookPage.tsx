'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Book, Category } from '@/types';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';

const LANGUAGES = ['tr', 'en', 'ru', 'az'] as const;

function categoryDisplayName(cat: Category, bookLanguage: string): string {
  const code = bookLanguage as keyof Category['nameTranslations'];
  if (code && LANGUAGES.includes(code as (typeof LANGUAGES)[number])) {
    const t = cat.nameTranslations[code]?.trim();
    if (t) return t;
  }
  return cat.name;
}

function sortLocaleForLanguage(lang: string): string {
  if (lang === 'tr') return 'tr';
  if (lang === 'ru') return 'ru';
  if (lang === 'az') return 'az';
  return 'en';
}

const EditBookPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { categories, loading: categoriesLoading } = useSupabaseCategories();
  const { authors, loading: authorsLoading, error: authorsError, refetch: refetchAuthors } =
    useSupabaseAuthors();

  const [bookLoading, setBookLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [pages, setPages] = useState('');
  const [tags, setTags] = useState('');

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

  const categoriesSorted = useMemo(() => {
    const loc = sortLocaleForLanguage(language);
    return [...categories].sort((a, b) =>
      categoryDisplayName(a, language).localeCompare(categoryDisplayName(b, language), loc, {
        sensitivity: 'base',
      })
    );
  }, [categories, language]);

  useEffect(() => {
    if (!id) {
      setLoadError('Geçersiz kitap bağlantısı.');
      setBookLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setBookLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/books/${id}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Kitap yüklenemedi');
        }
        if (cancelled) return;
        const b = data as Book;
        setTitle(b.title);
        setAuthor(b.author);
        setCategory(b.category);
        setDescription(b.description || '');
        setLanguage(b.language || 'tr');
        setPages(b.pages ? String(b.pages) : '');
        setTags(Array.isArray(b.tags) ? b.tags.join(', ') : '');
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Kitap yüklenemedi.');
        }
      } finally {
        if (!cancelled) setBookLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!categories.length || categoriesLoading || bookLoading) return;
    if (categoryId) return;
    if (!category) return;
    const m = categories.find((c) => c.name === category);
    if (m) setCategoryId(m.id);
  }, [categories, categoriesLoading, bookLoading, category, categoryId]);

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
    if (!id) return;
    if (!language.trim()) {
      setError('Lütfen dil seçin.');
      return;
    }
    if (!title.trim() || !author.trim()) {
      setError('Başlık ve yazar zorunludur.');
      return;
    }
    const useCategoryList = categories.length > 0 && !categoriesLoading;
    if (useCategoryList && !categoryId.trim()) {
      setError('Lütfen kategori seçin.');
      return;
    }
    if (!useCategoryList && !category.trim()) {
      setError('Kategori zorunludur.');
      return;
    }
    if (!authorsLoading && authorsSorted.length === 0) {
      setError('Önce en az bir yazar eklemeniz gerekir.');
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      author: author.trim(),
      description: description.trim() || undefined,
      language,
      pages: pages ? parseInt(pages, 10) : undefined,
      tags: tags.trim() ? tags.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    };
    if (useCategoryList) {
      payload.category_id = categoryId.trim();
    } else {
      payload.category = category.trim();
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }

      if (coverFile) {
        const coverForm = new FormData();
        coverForm.append('file', coverFile);
        const coverRes = await fetch(`/api/books/${id}/cover`, { method: 'POST', body: coverForm });
        if (!coverRes.ok) {
          const errData = await coverRes.json().catch(() => ({}));
          console.warn('Kapak yüklenemedi:', errData.error);
        }
      }

      const uploadFile = async (file: File, format: string) => {
        const form = new FormData();
        form.append('file', file);
        form.append('format', format);
        const r = await fetch(`/api/books/${id}/files`, { method: 'POST', body: form });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          console.warn(`${format} yüklenemedi:`, d.error);
        }
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

  if (!id || loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl">
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {loadError || 'Geçersiz kitap.'}
          </div>
          <Link href="/user/books" className="text-primary-600 hover:underline">
            Kitaplara dön
          </Link>
        </div>
      </div>
    );
  }

  if (bookLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl text-gray-600">Kitap yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Kitabı Düzenle</h1>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label htmlFor="language" className="block text-sm font-semibold text-gray-800 mb-2">
              Dil *
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
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
                <label htmlFor="author" className="block text-sm font-semibold text-gray-800 mb-2">
                  Yazar *
                </label>
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
                    id="author"
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500"
                  >
                    <option>Yazarlar yükleniyor...</option>
                  </select>
                ) : authorsSorted.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                    <p className="mb-2">Veritabanında henüz yazar yok.</p>
                    <Link
                      href="/user/authors/new"
                      className="font-medium text-primary-700 underline hover:no-underline"
                    >
                      Yeni yazar ekle →
                    </Link>
                  </div>
                ) : (
                  <select
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Yazar seçin</option>
                    {author && !authorsSorted.some((a) => a.name === author) && (
                      <option value={author}>{author}</option>
                    )}
                    {authorsSorted.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Kategori *</label>
                {categories.length > 0 && !categoriesLoading ? (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Kategori seçin</option>
                    {categoriesSorted.map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryDisplayName(c, language)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Kategori"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
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
                    Veya açıklamayı Word (DOC, DOCX) veya RTF dosyasından yükle
                  </label>
                  <input
                    type="file"
                    accept=".rtf,.doc,.docx,application/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleDescriptionFile}
                    disabled={descFileLoading}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50 disabled:opacity-50"
                  />
                  {descFileLoading && <span className="text-xs text-gray-500">Yükleniyor...</span>}
                </div>
              </div>

              <div className="max-w-xs">
                <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-1">
                  Sayfa sayısı
                </label>
                <input
                  id="pages"
                  type="number"
                  min={0}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Etiketler (virgülle ayırın)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="etiket1, etiket2"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapak resmi</label>
                <p className="text-xs text-gray-500 mb-1">
                  PNG veya JPG. Yeni dosya seçerseniz mevcut kapak değiştirilir.
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kitap dosyaları (PDF, EPUB, DOC)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Yeni dosya yüklerseniz aynı türdeki mevcut dosya kaydı değiştirilir.
                </p>
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
                    authorsSorted.length === 0
                  }
                  className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
                <Link
                  href="/user/books"
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  İptal
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditBookPage;
