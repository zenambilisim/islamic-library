'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Language } from '@/types';
import AdminShell from '@/components/admin/AdminShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  adminAlertError,
  adminBtnPrimary,
  adminBtnSecondary,
  adminInput,
  adminSelect,
  adminTextarea,
} from '@/components/admin/admin-classes';

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'az', label: 'Azərbaycan' },
];

const AddAuthorPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [language, setLanguage] = useState<Language>('tr');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch('/api/authors', {
        method: 'POST',
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

  return (
    <AdminShell className="max-w-2xl">
      <AdminPageHeader
        title="Yeni Yazar Ekle"
        description="Her dil için ayrı bir yazar kaydı oluşturun; slug sunucuda otomatik üretilir."
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
            {submitting ? 'Ekleniyor...' : 'Yazarı Ekle'}
          </button>
          <Link href="/admin/authors" className={adminBtnSecondary}>
            Yazarlara dön
          </Link>
        </div>
      </form>
    </AdminShell>
  );
};

export default AddAuthorPage;
