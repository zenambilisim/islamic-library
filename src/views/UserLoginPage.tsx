'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Lock,
  LogIn,
  Mail,
  User,
  UserPlus,
} from 'lucide-react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import HeroPattern from '@/components/home/HeroPattern';
import SiteLogo from '@/components/layout/SiteLogo';
import {
  adminBtnPrimary,
  adminInputWithIcon,
  adminLabel,
  adminLinkBack,
} from '@/components/admin/admin-classes';
import type { Language } from '@/types';

type Mode = 'login' | 'signup';

const LANG_CODES: Language[] = ['tr', 'en', 'ru', 'az'];

const UserLoginPage = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup } = useUserAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const redirectTo = searchParams.get('from') || '/library';
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] as Language;

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
      if (mode === 'login') {
        const result = await login(formData.email.trim(), formData.password);
        if (result.error) {
          setStatus({ type: 'error', message: result.error });
          return;
        }
        setStatus({ type: 'success', message: t('userAuth.loginSuccess') });
      } else {
        const result = await signup(
          formData.email.trim(),
          formData.password,
          formData.displayName.trim() || undefined,
        );
        if (result.error) {
          setStatus({ type: 'error', message: result.error });
          return;
        }
        if (result.needsEmailConfirmation) {
          setStatus({ type: 'success', message: t('userAuth.confirmEmail') });
          return;
        }
        setStatus({ type: 'success', message: t('userAuth.signupSuccess') });
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setStatus({ type: 'error', message: t('userAuth.errorDefault') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-md shrink-0 justify-end px-4 pt-4">
        <div
          className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5"
          role="tablist"
          aria-label={t('common.language')}
        >
          {LANG_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => i18n.changeLanguage(code)}
              className={`h-7 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
                currentLang === code ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-6 pb-12 md:py-10">
        <Link
          href="/"
          className="mb-6 flex w-fit flex-col items-center gap-3 text-center transition-opacity hover:opacity-90"
        >
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-2 shadow-soft">
            <SiteLogo size={52} className="h-full w-full" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-ink">Islamic Library</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-ink-muted">
              {t('common.siteTagline', 'İslami Dijital Kütüphane')}
            </p>
          </div>
        </Link>

        <section className="relative w-full overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-soft md:p-8">
          <HeroPattern />
          <div className="relative mb-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {t('userAuth.heroEyebrow', 'Hesabınız')}
            </p>
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
              {mode === 'login' ? t('userAuth.loginTitle') : t('userAuth.signupTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{t('userAuth.subtitle')}</p>
          </div>

          <div
            className="relative mb-6 flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setStatus({ type: null, message: '' });
              }}
              className={`flex-1 rounded-full py-2 text-[13px] font-medium transition-colors ${
                mode === 'login' ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t('userAuth.tabLogin')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => {
                setMode('signup');
                setStatus({ type: null, message: '' });
              }}
              className={`flex-1 rounded-full py-2 text-[13px] font-medium transition-colors ${
                mode === 'signup' ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t('userAuth.tabSignup')}
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="relative space-y-4">
            {status.type && (
              <div
                className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 ${
                  status.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="shrink-0 text-green-600" size={20} />
                ) : (
                  <AlertCircle className="shrink-0 text-red-600" size={20} />
                )}
                <p className="text-sm">{status.message}</p>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="displayName" className={adminLabel}>
                  {t('userAuth.displayNameLabel')}
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                    size={18}
                    aria-hidden
                  />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    autoComplete="name"
                    className={adminInputWithIcon}
                    placeholder={t('userAuth.displayNamePlaceholder')}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={adminLabel}>
                {t('userAuth.emailLabel')}
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
                  className={adminInputWithIcon}
                  placeholder={t('userAuth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={adminLabel}>
                {t('userAuth.passwordLabel')}
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
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={adminInputWithIcon}
                  placeholder={t('userAuth.passwordPlaceholder')}
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={`${adminBtnPrimary} w-full`}>
              {mode === 'login' ? <LogIn size={18} strokeWidth={2} /> : <UserPlus size={18} strokeWidth={2} />}
              <span>
                {isSubmitting
                  ? t('userAuth.submitting')
                  : mode === 'login'
                    ? t('userAuth.submitLogin')
                    : t('userAuth.submitSignup')}
              </span>
            </button>
          </form>
        </section>

        <Link href="/" className={`${adminLinkBack} mt-auto pt-6`}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          {t('userAuth.backToHome')}
        </Link>
      </div>
    </div>
  );
};

export default UserLoginPage;
