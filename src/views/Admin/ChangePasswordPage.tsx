'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, CheckCircle, KeyRound, Lock } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import {
  adminBtnPrimary,
  adminCard,
  adminInputWithIcon,
  adminLabel,
  adminLinkBack,
} from '@/components/admin/admin-classes';

const ChangePasswordPage = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: t('admin.changePassword.mismatch') });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || t('admin.changePassword.errorDefault') });
        return;
      }
      setStatus({ type: 'success', message: t('admin.changePassword.success') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setStatus({ type: 'error', message: t('admin.changePassword.errorDefault') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell className="max-w-lg">
      <Link href="/admin/dashboard" className={`${adminLinkBack} mb-6`}>
        <ArrowLeft size={16} aria-hidden />
        {t('admin.changePassword.back')}
      </Link>

      <div className={`${adminCard} p-6 md:p-8`}>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <KeyRound size={20} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
              {t('admin.changePassword.title')}
            </h1>
            <p className="mt-1 text-[13px] text-ink-muted">{t('admin.changePassword.description')}</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
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

          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
            const labels = {
              currentPassword: t('admin.changePassword.currentLabel'),
              newPassword: t('admin.changePassword.newLabel'),
              confirmPassword: t('admin.changePassword.confirmLabel'),
            };
            const values = { currentPassword, newPassword, confirmPassword };
            const setters = {
              currentPassword: setCurrentPassword,
              newPassword: setNewPassword,
              confirmPassword: setConfirmPassword,
            };
            return (
              <div key={field}>
                <label htmlFor={field} className={adminLabel}>
                  {labels[field]}
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                    size={18}
                  />
                  <input
                    id={field}
                    type="password"
                    autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                    value={values[field]}
                    onChange={(e) => setters[field](e.target.value)}
                    className={adminInputWithIcon}
                    required
                    minLength={field === 'currentPassword' ? undefined : 6}
                  />
                </div>
              </div>
            );
          })}

          <button type="submit" disabled={submitting} className={`${adminBtnPrimary} w-full`}>
            {submitting ? t('admin.changePassword.submitting') : t('admin.changePassword.submit')}
          </button>
        </form>
      </div>
    </AdminShell>
  );
};

export default ChangePasswordPage;
