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

const AddCategoryPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<Language>('tr');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch('/api/categories', {
        method: 'POST',
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

  return (
    <AdminShell className="max-w-2xl">
      <AdminPageHeader
        title="Yeni Kategori Ekle"
        description="Her dil için ayrı bir kategori satırı oluşturun; slug sunucuda otomatik üretilir."
      />

      {error && <div className={adminAlertError}>{error}</div>}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <AdminFormSection label="Dil *" htmlFor="category-lang">
          <select
            id="category-lang"
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

        <AdminFormSection label="Kategori adı *" htmlFor="category-name">
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Tefsir"
            className={adminInput}
          />
        </AdminFormSection>

        <AdminFormSection label="Açıklama" htmlFor="category-desc">
          <textarea
            id="category-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kısa açıklama"
            rows={4}
            className={adminTextarea}
          />
        </AdminFormSection>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={submitting} className={adminBtnPrimary}>
            {submitting ? 'Ekleniyor...' : 'Kategoriyi Ekle'}
          </button>
          <Link href="/admin/categories" className={adminBtnSecondary}>
            Kategorilere dön
          </Link>
        </div>
      </form>
    </AdminShell>
  );
};

export default AddCategoryPage;
