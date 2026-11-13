'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, LogOut, Mail, Pencil, Trash2, X } from 'lucide-react';
import HeroPattern from '@/components/home/HeroPattern';
import ChangePasswordDialog from '@/components/library/ChangePasswordDialog';
import EditProfileDialog from '@/components/library/EditProfileDialog';
import { adminBtnDanger, adminBtnSecondary, adminInput, adminLabel } from '@/components/admin/admin-classes';

interface LibraryHeroProps {
  displayName?: string | null;
  email?: string | null;
  bio?: string | null;
  onLogout?: () => void;
  onDeleteAccount?: (password: string) => Promise<{ error?: string }>;
  onUpdateProfile?: (patch: { displayName: string; bio: string }) => Promise<{ error?: string }>;
  onChangePassword?: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ error?: string }>;
}

const LibraryHero = ({
  displayName,
  email,
  bio,
  onLogout,
  onDeleteAccount,
  onUpdateProfile,
  onChangePassword,
}: LibraryHeroProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const name = displayName?.trim();
  const mail = email?.trim();

  const closeDialog = () => {
    if (isDeleting) return;
    setDialogOpen(false);
    setPassword('');
    setError(null);
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isDeleting) return;
      setDialogOpen(false);
      setPassword('');
      setError(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogOpen, isDeleting]);

  const handleSaveProfile = async (patch: { displayName: string; bio: string }) => {
    if (!onUpdateProfile) return;
    setIsSaving(true);
    setEditError(null);
    const result = await onUpdateProfile(patch);
    setIsSaving(false);
    if (result.error) {
      setEditError(result.error);
      return;
    }
    setEditOpen(false);
  };

  const handleChangePassword = async (input: {
    currentPassword: string;
    newPassword: string;
  }) => {
    if (!onChangePassword) return;
    setIsChangingPassword(true);
    setPasswordError(null);
    const result = await onChangePassword(input.currentPassword, input.newPassword);
    setIsChangingPassword(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setPasswordOpen(false);
    setPasswordSuccess(true);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onDeleteAccount) return;
    const pw = password.trim();
    if (!pw) {
      setError(t('userAuth.deleteAccountPasswordRequired'));
      return;
    }
    setIsDeleting(true);
    setError(null);
    const result = await onDeleteAccount(pw);
    setIsDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    setPassword('');
  };

  return (
    <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-7 shadow-soft md:p-8">
      <HeroPattern />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {name ? (
            <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-[2.375rem]">
              {name}
            </h1>
          ) : mail ? (
            <h1 className="font-display text-xl font-medium leading-snug tracking-tight text-ink md:text-2xl">
              {mail}
            </h1>
          ) : null}
          {name && mail && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
              <Mail size={14} strokeWidth={1.75} className="shrink-0 text-ink-faint" aria-hidden />
              {mail}
            </p>
          )}
          {!name && !mail && (
            <p className="font-display text-2xl font-medium text-ink">{t('readingList.myLibrary')}</p>
          )}
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-[15px]">
            {bio?.trim() || t('readingList.pageDescription')}
          </p>
        </div>
        {(onLogout || onDeleteAccount || onUpdateProfile || onChangePassword) && (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {onUpdateProfile && (
              <button
                type="button"
                onClick={() => {
                  setEditError(null);
                  setEditOpen(true);
                }}
                className={`${adminBtnSecondary} shrink-0`}
              >
                <Pencil size={18} strokeWidth={2} aria-hidden />
                {t('userAuth.editProfile')}
              </button>
            )}
            {onChangePassword && (
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null);
                  setPasswordSuccess(false);
                  setPasswordOpen(true);
                }}
                className={`${adminBtnSecondary} shrink-0`}
              >
                <KeyRound size={18} strokeWidth={2} aria-hidden />
                {t('userAuth.changePassword')}
              </button>
            )}
            {passwordSuccess && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
                {t('userAuth.changePasswordSuccess')}
              </p>
            )}
            {onLogout && (
              <button type="button" onClick={onLogout} className={`${adminBtnSecondary} shrink-0`}>
                <LogOut size={18} strokeWidth={2} aria-hidden />
                {t('userAuth.logout')}
              </button>
            )}
            {onDeleteAccount && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className={`${adminBtnDanger} shrink-0`}
              >
                <Trash2 size={18} strokeWidth={2} aria-hidden />
                {t('userAuth.deleteAccount')}
              </button>
            )}
          </div>
        )}
      </div>

      <EditProfileDialog
        open={editOpen}
        displayName={displayName}
        bio={bio}
        isSaving={isSaving}
        error={editError}
        onClose={() => {
          if (isSaving) return;
          setEditOpen(false);
          setEditError(null);
        }}
        onSave={handleSaveProfile}
      />

      <ChangePasswordDialog
        open={passwordOpen}
        isSaving={isChangingPassword}
        error={passwordError}
        onClose={() => {
          if (isChangingPassword) return;
          setPasswordOpen(false);
          setPasswordError(null);
        }}
        onSave={handleChangePassword}
      />

      {dialogOpen && onDeleteAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
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
                {t('userAuth.deleteAccountTitle')}
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isDeleting}
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
                aria-label={t('userAuth.deleteAccountCancel')}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-ink-muted">{t('userAuth.deleteAccountBody')}</p>
            <form onSubmit={(e) => void handleDelete(e)} className="space-y-4">
              <div>
                <label htmlFor="delete-account-password" className={adminLabel}>
                  {t('userAuth.deleteAccountPassword')}
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={adminInput}
                  disabled={isDeleting}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isDeleting}
                  className={adminBtnSecondary}
                >
                  {t('userAuth.deleteAccountCancel')}
                </button>
                <button type="submit" disabled={isDeleting} className={adminBtnDanger}>
                  <Trash2 size={16} strokeWidth={2} aria-hidden />
                  {isDeleting ? t('userAuth.deleteAccountDeleting') : t('userAuth.deleteAccountConfirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default LibraryHero;
