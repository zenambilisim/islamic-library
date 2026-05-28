'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Author, Language } from '@/types';
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

const EditAuthorPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [language, setLanguage] = useState<Language>('tr');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoadError('Geçersiz yazar.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/authors/by-id/${encodeURIComponent(id)}`);
        const data = (await res.json()) as Author & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || res.statusText);
        }
        if (cancelled) return;
        const a = data as Author;
        setName(a.name);
        setBiography(a.biography || '');
        setLanguage(a.language);
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

    setSubmitting(true);
    try {
      const res = await fetch(`/api/authors/by-id/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrim,
          biography: biography.trim(),
          language_code: language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.push('/admin/authors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminShell className="max-w-2xl">
        <div className={adminLoadingState}>Yükleniyor...</div>
      </AdminShell>
    );
  }

  if (loadError) {
    return (
      <AdminShell className="max-w-2xl space-y-4">
        <div className={adminAlertError}>{loadError}</div>
        <Link href="/admin/authors" className={adminLinkAccent}>
          Yazarlara dön
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell className="max-w-2xl">
      <AdminPageHeader
        title="Yazarı Düzenle"
        description="Bu kayıt tek bir dil için geçerlidir. Başka dilde isim için yeni yazar kaydı ekleyin."
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

        <AdminFormSection label="Ad *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yazar adı"
            className={adminInput}
          />
        </AdminFormSection>

        <AdminFormSection label="Biyografi">
          <textarea
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Kısa biyografi"
            rows={5}
            className={adminTextarea}
          />
        </AdminFormSection>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={submitting} className={adminBtnPrimary}>
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <Link href="/admin/authors" className={adminBtnSecondary}>
            İptal
          </Link>
        </div>
      </form>
    </AdminShell>
  );
};

export default EditAuthorPage;
