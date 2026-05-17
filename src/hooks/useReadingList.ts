'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReadingStatus } from '@/types';
import { useUserAuth } from '@/contexts/UserAuthContext';

export function useBookReadingStatus(bookId: string | undefined) {
  const { user, isLoading: authLoading } = useUserAuth();
  const [status, setStatus] = useState<ReadingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!bookId || !user) {
      setStatus(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/user/reading-list?bookId=${encodeURIComponent(bookId)}`,
        { credentials: 'include' }
      );
      if (res.status === 401) {
        setStatus(null);
        return;
      }
      const data = await res.json();
      setStatus(data.status ?? null);
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user]);

  useEffect(() => {
    if (authLoading) return;
    void fetchStatus();
  }, [authLoading, fetchStatus]);

  const setReadingStatus = useCallback(
    async (next: ReadingStatus) => {
      if (!bookId || !user) {
        return { error: 'login_required' as const };
      }
      setIsSaving(true);
      try {
        if (status === next) {
          const res = await fetch(
            `/api/user/reading-list?bookId=${encodeURIComponent(bookId)}`,
            { method: 'DELETE', credentials: 'include' }
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { error: data.error || 'remove_failed' };
          }
          setStatus(null);
          return {};
        }

        const res = await fetch('/api/user/reading-list', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bookId, status: next }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { error: data.error || 'save_failed' };
        }
        setStatus(next);
        return {};
      } finally {
        setIsSaving(false);
      }
    },
    [bookId, user, status]
  );

  return {
    status,
    isLoading: authLoading || isLoading,
    isSaving,
    isLoggedIn: !!user,
    setReadingStatus,
    refreshStatus: fetchStatus,
  };
}
