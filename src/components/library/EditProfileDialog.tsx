'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminInput,
  adminLabel,
  adminTextarea,
} from '@/components/admin/admin-classes';

interface EditProfileDialogProps {
  open: boolean;
  displayName?: string | null;
  bio?: string | null;
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (patch: { displayName: string; bio: string }) => Promise<void>;
}

const EditProfileDialog = ({
  open,
  displayName,
  bio,
  isSaving = false,
  error,
  onClose,
  onSave,
}: EditProfileDialogProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [name, setName] = useState(displayName ?? '');
  const [about, setAbout] = useState(bio ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(displayName ?? '');
    setAbout(bio ?? '');
    setLocalError(null);
  }, [open, displayName, bio]);

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
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError(t('userAuth.displayNameRequired'));
      return;
    }
    setLocalError(null);
    await onSave({ displayName: trimmedName, bio: about.trim() });
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
            {t('userAuth.editProfileTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
            aria-label={t('userAuth.editProfileCancel')}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="edit-profile-name" className={adminLabel}>
              {t('userAuth.displayNameLabel')}
            </label>
            <input
              id="edit-profile-name"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={adminInput}
              disabled={isSaving}
              autoComplete="nickname"
            />
          </div>
          <div>
            <label htmlFor="edit-profile-bio" className={adminLabel}>
              {t('userAuth.bioLabel')}
            </label>
            <textarea
              id="edit-profile-bio"
              maxLength={500}
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className={adminTextarea}
              disabled={isSaving}
              placeholder={t('userAuth.bioPlaceholder')}
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
              {t('userAuth.editProfileCancel')}
            </button>
            <button type="submit" disabled={isSaving} className={adminBtnPrimary}>
              {isSaving ? t('userAuth.editProfileSaving') : t('userAuth.editProfileSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileDialog;
