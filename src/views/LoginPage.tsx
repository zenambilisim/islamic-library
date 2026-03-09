'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

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
      router.push('/user/dashboard');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('login.pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            {t('login.pageDescription')}
          </p>
        </div>

        {/* Form kartı */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <LogIn className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('login.formTitle')}
              </h2>
            </div>

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

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('login.emailLabel')}
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="search-input pl-10"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('login.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="search-input pl-10"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSubmitting ? 'opacity-70' : ''
                }`}
              >
                <LogIn size={20} />
                <span>
                  {isSubmitting ? t('login.submittingButton') : t('login.submitButton')}
                </span>
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t('login.noAccount')}{' '}
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('login.backToHome')}
              </Link>
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>{t('login.backToHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
