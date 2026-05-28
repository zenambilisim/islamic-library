'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category, Language } from '@/types';
import AdminShell from '@/components/admin/AdminShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  adminAlertError,
  adminBtnPrimary,
  adminBtnSecondary,
  adminInput,
  adminLinkAccent,
  adminLoadingState,
  adminSelect,
  adminTextarea,
} from '@/components/admin/admin-classes';

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'az', label: 'Azərbaycan' },
];

type Props = { categoryId: string };

const EditCategoryPage = ({ categoryId }: Props) => {
  const router = useRouter();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<Language>('tr');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
        setLanguage(c.language);
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

    setSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrim,
          description: description.trim(),
          language_code: language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.push('/admin/categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminShell className="max-w-2xl">
        <div className={adminLoadingState}>Kategori yükleniyor...</div>
      </AdminShell>
    );
  }

  if (loadError) {
    return (
      <AdminShell className="max-w-2xl space-y-4">
        <div className={adminAlertError}>{loadError}</div>
        <Link href="/admin/categories" className={adminLinkAccent}>
          Kategorilere dön
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell className="max-w-2xl">
      <AdminPageHeader
        title="Kategori Düzenle"
        description="Değişiklikler kaydedildiğinde slug, ad ile uyumlu olacak şekilde gerekirse güncellenir."
      />

      {error && <div className={adminAlertError}>{error}</div>}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <AdminFormSection label="Dil *">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className={adminSelect}
          >
            {LANG_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </AdminFormSection>

        <AdminFormSection label="Kategori adı *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Tefsir"
            className={adminInput}
          />
        </AdminFormSection>

        <AdminFormSection label="Açıklama">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kısa açıklama"
            rows={4}
            className={adminTextarea}
          />
        </AdminFormSection>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={submitting} className={adminBtnPrimary}>
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <Link href="/admin/categories" className={adminBtnSecondary}>
            İptal
          </Link>
        </div>
      </form>
    </AdminShell>
  );
};

export default EditCategoryPage;
