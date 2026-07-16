'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, CheckCircle, Lock, LogIn, Mail } from 'lucide-react';
import HeroPattern from '@/components/home/HeroPattern';
import SiteLogo from '@/components/layout/SiteLogo';

const inputClassName =
  'w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent';

const LoginPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatus({ type: null, message: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.error || t('login.errorDefault'),
        });
        return;
      }

      setStatus({
        type: 'success',
        message: t('login.successMessage'),
      });
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setStatus({
        type: 'error',
        message: t('login.errorDefault'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="mx-auto flex w-fit flex-col items-center gap-3 text-center transition-opacity hover:opacity-90"
        >
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-2 shadow-soft">
            <SiteLogo size={52} className="h-full w-full" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-ink">Islamic Library</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-ink-muted">
              {t('admin.nav.adminArea', 'Admin')}
            </p>
          </div>
        </Link>

        <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-soft md:p-8">
          <HeroPattern />
          <div className="relative">
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
              {t('login.pageTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{t('login.formTitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="relative mt-6 space-y-5">
            {status.type && (
              <div
                className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 ${
                  status.type === 'success'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="shrink-0 text-green-600" size={20} />
                ) : (
                  <AlertCircle className="shrink-0 text-red-600" size={20} />
                )}
                <p
                  className={`text-sm ${
                    status.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {status.message}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-[12.5px] font-medium text-ink-muted">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                  size={18}
                  aria-hidden
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={inputClassName}
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[12.5px] font-medium text-ink-muted"
              >
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                  size={18}
                  aria-hidden
                />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className={inputClassName}
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-cream transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn size={18} strokeWidth={2} />
              <span>
                {isSubmitting ? t('login.submittingButton') : t('login.submitButton')}
              </span>
            </button>
          </form>
        </section>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-accent"
        >
          <ArrowLeft size={18} strokeWidth={2} />
          {t('login.backToHome')}
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
