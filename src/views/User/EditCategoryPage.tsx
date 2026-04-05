'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category } from '@/types';

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  az: 'Azərbaycan',
};

type Props = { categoryId: string };

const EditCategoryPage = ({ categoryId }: Props) => {
  const router = useRouter();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [nameAz, setNameAz] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [descAz, setDescAz] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        const c = data.category as Category | undefined;
        if (!c || cancelled) return;
        setName(c.name);
        setDescription(c.description || '');
        setIcon(c.icon ?? '');
        setNameEn(c.nameTranslations.en);
        setNameRu(c.nameTranslations.ru);
        setNameAz(c.nameTranslations.az);
        setDescEn(c.descriptionTranslations.en);
        setDescRu(c.descriptionTranslations.ru);
        setDescAz(c.descriptionTranslations.az);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Kategori yüklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameTrim = name.trim();
    if (!nameTrim) {
      setError('Kategori adı zorunludur.');
      return;
    }

    const descTrim = description.trim();

    setSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrim,
          description: descTrim,
          icon: icon.trim() || undefined,
          name_translations: {
            tr: nameTrim,
            en: nameEn.trim(),
            ru: nameRu.trim(),
            az: nameAz.trim(),
          },
          description_translations: {
            tr: descTrim,
            en: descEn.trim(),
            ru: descRu.trim(),
            az: descAz.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.push('/user/categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl text-gray-600">Kategori yükleniyor...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl space-y-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{loadError}</div>
          <Link href="/user/categories" className="text-primary-600 font-medium hover:underline">
            Kategorilere dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Kategori Düzenle</h1>
        <p className="text-sm text-gray-600 mb-6">
          Değişiklikler kaydedildiğinde slug, ad ile uyumlu olacak şekilde gerekirse güncellenir.
        </p>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Kategori adı *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Tefsir"
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kısa açıklama"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Açıklama çevirileri (isteğe bağlı)</h2>
            {(['en', 'ru', 'az'] as const).map((code) => (
              <div key={code}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Açıklama — {LANG_LABELS[code]}
                </label>
                <textarea
                  value={code === 'en' ? descEn : code === 'ru' ? descRu : descAz}
                  onChange={(e) => {
                    if (code === 'en') setDescEn(e.target.value);
                    else if (code === 'ru') setDescRu(e.target.value);
                    else setDescAz(e.target.value);
                  }}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-800 mb-2">İkon (isteğe bağlı)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Emoji veya kısa metin"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
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
              href="/user/categories"
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

export default EditCategoryPage;
