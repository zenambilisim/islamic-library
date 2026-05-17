'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, UserPlus, User } from 'lucide-react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { LanguageSelector } from '@/components/layout/LanguageSelector';

type Mode = 'login' | 'signup';

const UserLoginPage = () => {
  const { t } = useTranslation();
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
          formData.displayName.trim() || undefined
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="container mx-auto px-4 py-4 flex justify-end">
        <LanguageSelector />
      </header>
      <div className="container mx-auto px-4 pb-8 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            {mode === 'login' ? t('userAuth.loginTitle') : t('userAuth.signupTitle')}
          </h1>
          <p className="text-gray-600 mt-2">{t('userAuth.subtitle')}</p>
        </div>

        <div className="w-full max-w-md">
          <div className="flex mb-6 bg-white rounded-xl border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('userAuth.tabLogin')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('userAuth.tabSignup')}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {status.type && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    status.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  ) : (
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
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

              {mode === 'signup' && (
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('userAuth.displayNameLabel')}
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      autoComplete="name"
                      className="search-input pl-10"
                      placeholder={t('userAuth.displayNamePlaceholder')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('userAuth.emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="search-input pl-10"
                    placeholder={t('userAuth.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('userAuth.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="search-input pl-10"
                    placeholder={t('userAuth.passwordPlaceholder')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>
                  {isSubmitting
                    ? t('userAuth.submitting')
                    : mode === 'login'
                      ? t('userAuth.submitLogin')
                      : t('userAuth.submitSignup')}
                </span>
              </button>
            </form>
          </div>

          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>{t('userAuth.backToHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
