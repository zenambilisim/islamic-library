'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookMarked, CheckCircle, Loader2 } from 'lucide-react';
import type { ReadingStatus } from '@/types';
import { useBookReadingStatus } from '@/hooks/useReadingList';

const STATUS_CONFIG: {
  status: ReadingStatus;
  icon: typeof Bookmark;
  colorActive: string;
}[] = [
  { status: 'want_to_read', icon: Bookmark, colorActive: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800' },
  { status: 'reading', icon: BookMarked, colorActive: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800' },
  { status: 'read', icon: CheckCircle, colorActive: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800' },
];

interface ReadingListControlsProps {
  bookId: string;
  compact?: boolean;
}

const ReadingListControls = ({ bookId, compact = false }: ReadingListControlsProps) => {
  const { t } = useTranslation();
  const { status, isLoading, isSaving, isLoggedIn, setReadingStatus } = useBookReadingStatus(bookId);

  if (isLoading) {
    return (
      <div className={compact ? 'flex h-9 items-center' : 'flex h-12 items-center justify-center'}>
        <Loader2 className="animate-spin text-ink-faint" size={compact ? 18 : 22} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <p className={`text-sm text-ink-muted ${compact ? '' : 'rounded-lg border border-dashed border-[var(--border)] p-3'}`}>
        {t('readingList.loginPrompt')}{' '}
        <Link href="/user/login" className="font-medium text-accent hover:underline">
          {t('readingList.loginLink')}
        </Link>
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {!compact && (
        <p className="text-sm font-medium text-ink-muted">{t('readingList.addToList')}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {STATUS_CONFIG.map(({ status: s, icon: Icon, colorActive }) => {
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              disabled={isSaving}
              onClick={() => void setReadingStatus(s)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                active
                  ? colorActive
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-ink-muted hover:bg-[var(--surface-3)] hover:text-ink'
              } ${compact ? 'px-2 py-1 text-xs' : ''}`}
            >
              {isSaving && active ? (
                <Loader2 size={compact ? 14 : 16} className="animate-spin shrink-0" />
              ) : (
                <Icon size={compact ? 14 : 16} className="shrink-0" />
              )}
              <span>{t(`readingList.status.${s}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReadingListControls;
