'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Author } from '@/types';

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  az: 'Azərbaycan',
};

const EditAuthorPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [nameAz, setNameAz] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [bioRu, setBioRu] = useState('');
  const [bioAz, setBioAz] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoadError('Geçersiz yazar.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/authors/by-id/${encodeURIComponent(id)}`);
        const data = (await res.json()) as Author & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || res.statusText);
        }
        if (cancelled) return;
        const a = data as Author;
        setName(a.nameTranslations?.tr || a.name);
        setNameEn(a.nameTranslations?.en ?? '');
        setNameRu(a.nameTranslations?.ru ?? '');
        setNameAz(a.nameTranslations?.az ?? '');
        setBiography(a.biographyTranslations?.tr || a.biography || '');
        setBioEn(a.biographyTranslations?.en ?? '');
        setBioRu(a.biographyTranslations?.ru ?? '');
        setBioAz(a.biographyTranslations?.az ?? '');
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Yazar yüklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameTrim = name.trim();
    if (!nameTrim) {
      setError('Yazar adı zorunludur.');
      return;
    }

    const bioTrim = biography.trim();

    setSubmitting(true);
    try {
      const res = await fetch(`/api/authors/by-id/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrim,
          biography: bioTrim,
          name_translations: {
            tr: nameTrim,
            en: nameEn.trim(),
            ru: nameRu.trim(),
            az: nameAz.trim(),
          },
          biography_translations: {
            tr: bioTrim,
            en: bioEn.trim(),
            ru: bioRu.trim(),
            az: bioAz.trim(),
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 mb-4">{loadError}</div>
        <Link href="/user/authors" className="text-primary-600 hover:underline">
          Yazarlara dön
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Yazarı Düzenle</h1>
        <p className="text-sm text-gray-600 mb-6">
          Birincil ad ve biyografi Türkçe alanlara yazılır; diğer dilleri isteğe bağlı doldurabilirsiniz.
        </p>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Ad (Türkçe / birincil) *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yazar adı"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">İsim çevirileri (isteğe bağlı)</h2>
            <p className="text-xs text-gray-500">Boş bıraktığınız dillerde birincil ad kullanılır.</p>
            {(['en', 'ru', 'az'] as const).map((code) => (
              <div key={code}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Ad — {LANG_LABELS[code]}
                </label>
                <input
                  type="text"
                  value={code === 'en' ? nameEn : code === 'ru' ? nameRu : nameAz}
                  onChange={(e) => {
                    if (code === 'en') setNameEn(e.target.value);
                    else if (code === 'ru') setNameRu(e.target.value);
                    else setNameAz(e.target.value);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Biyografi</label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Kısa biyografi"
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Biyografi çevirileri (isteğe bağlı)</h2>
            {(['en', 'ru', 'az'] as const).map((code) => (
              <div key={code}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Biyografi — {LANG_LABELS[code]}
                </label>
                <textarea
                  value={code === 'en' ? bioEn : code === 'ru' ? bioRu : bioAz}
                  onChange={(e) => {
                    if (code === 'en') setBioEn(e.target.value);
                    else if (code === 'ru') setBioRu(e.target.value);
                    else setBioAz(e.target.value);
                  }}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <Link
              href="/user/authors"
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAuthorPage;
