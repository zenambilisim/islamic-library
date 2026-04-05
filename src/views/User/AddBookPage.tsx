'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';

const LANGUAGES = ['tr', 'en', 'ru', 'az'] as const;

const AddBookPage = () => {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useSupabaseCategories();
  const { authors, loading: authorsLoading } = useSupabaseAuthors();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [pages, setPages] = useState('');
  const [publishYear, setPublishYear] = useState(String(new Date().getFullYear()));
  const [tags, setTags] = useState('');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rtfLoading, setRtfLoading] = useState(false);

  const handleRtfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRtfLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/rtf-to-text', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'RTF işlenemedi');
      }
      if (data.text != null) {
        setDescription((prev) => (prev.trim() ? prev.trim() + '\n\n' + data.text : data.text));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'RTF dosyası okunamadı.');
    } finally {
      setRtfLoading(false);
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
    if (!title.trim() || !author.trim() || !category.trim()) {
      setError('Başlık, yazar ve kategori zorunludur.');
      return;
    }

    const payload = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      description: description.trim() || undefined,
      language,
      pages: pages ? parseInt(pages, 10) : undefined,
      publish_year: publishYear ? parseInt(publishYear, 10) : undefined,
      tags: tags.trim() ? tags.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    };

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
        const coverForm = new FormData();
        coverForm.append('file', coverFile);
        const coverRes = await fetch(`/api/books/${bookId}/cover`, { method: 'POST', body: coverForm });
        if (!coverRes.ok) {
          const errData = await coverRes.json().catch(() => ({}));
          console.warn('Kapak yüklenemedi:', errData.error);
        }
      }

      const uploadFile = async (file: File, format: string) => {
        const form = new FormData();
        form.append('file', file);
        form.append('format', format);
        const r = await fetch(`/api/books/${bookId}/files`, { method: 'POST', body: form });
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">Yazar *</label>
            {authors.length > 0 && !authorsLoading ? (
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Yazar seçin</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Yazar adı"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            )}
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Kategori *</label>
            {categories.length > 0 && !categoriesLoading ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Kategori seçin</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
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
              <label className="block text-xs text-gray-500 mb-1">Veya açıklamayı RTF dosyasından yükle</label>
              <input
                type="file"
                accept=".rtf,application/rtf"
                onChange={handleRtfFile}
                disabled={rtfLoading}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50 disabled:opacity-50"
              />
              {rtfLoading && <span className="text-xs text-gray-500">Yükleniyor...</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-1">Sayfa sayısı</label>
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
              <label htmlFor="publishYear" className="block text-sm font-medium text-gray-700 mb-1">Yayın yılı</label>
              <input
                id="publishYear"
                type="number"
                min={1}
                max={2100}
                value={publishYear}
                onChange={(e) => setPublishYear(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Etiketler (virgülle ayırın)</label>
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
              disabled={submitting}
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
