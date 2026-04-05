'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const AddAuthorPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Yazar adı zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          biography: biography.trim(),
          name_translations: {
            tr: name.trim(),
            en: name.trim(),
            ru: name.trim(),
            az: name.trim(),
          },
          biography_translations: {
            tr: biography.trim(),
            en: biography.trim(),
            ru: biography.trim(),
            az: biography.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.push('/user/authors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Yazar Ekle</h1>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Yazar adı *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yazar adı"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Biyografi</label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Kısa biyografi"
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Ekleniyor...' : 'Yazarı Ekle'}
            </button>
            <Link
              href="/user/authors"
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Yazarlara dön
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAuthorPage;
