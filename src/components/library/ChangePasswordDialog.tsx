'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminInput,
  adminLabel,
} from '@/components/admin/admin-classes';

interface ChangePasswordDialogProps {
  open: boolean;
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const ChangePasswordDialog = ({
  open,
  isSaving = false,
  error,
  onClose,
  onSave,
}: ChangePasswordDialogProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLocalError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isSaving) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isSaving, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setLocalError(t('userAuth.changePasswordRequired'));
      return;
    }
    if (newPassword.length < 6) {
      setLocalError(t('userAuth.changePasswordTooShort'));
      return;
    }
    if (newPassword === currentPassword) {
      setLocalError(t('userAuth.changePasswordSame'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError(t('userAuth.changePasswordMismatch'));
      return;
    }
    setLocalError(null);
    await onSave({ currentPassword, newPassword });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-lift"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
            {t('userAuth.changePasswordTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
            aria-label={t('userAuth.changePasswordCancel')}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="change-password-current" className={adminLabel}>
              {t('userAuth.changePasswordCurrent')}
            </label>
            <input
              id="change-password-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={adminInput}
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="change-password-new" className={adminLabel}>
              {t('userAuth.changePasswordNew')}
            </label>
            <input
              id="change-password-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={adminInput}
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="change-password-confirm" className={adminLabel}>
              {t('userAuth.changePasswordConfirm')}
            </label>
            <input
              id="change-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={adminInput}
              disabled={isSaving}
            />
          </div>
          {(localError || error) && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {localError || error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={adminBtnSecondary}
            >
              {t('userAuth.changePasswordCancel')}
            </button>
            <button type="submit" disabled={isSaving} className={adminBtnPrimary}>
              {isSaving ? t('userAuth.changePasswordSaving') : t('userAuth.changePasswordSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordDialog;
