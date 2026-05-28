'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { adminCard, adminLinkBack } from '@/components/admin/admin-classes';

type TrafficPeriod = { requests: number; uniques: number };
type AnalyticsData = {
  today: TrafficPeriod;
  last7Days: TrafficPeriod;
  last30Days: TrafficPeriod;
  daily: { date: string; requests: number; uniques: number }[];
};

function formatCount(n: number, locale: string): string {
  return n.toLocaleString(locale);
}

function formatDayLabel(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

const TrafficPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'tr';
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || t('admin.traffic.error'));
        }
        if (!cancelled) setAnalytics(data as AnalyticsData);
      } catch (e) {
        if (!cancelled) {
          setAnalytics(null);
          setError(e instanceof Error ? e.message : t('admin.traffic.error'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const periodCards = analytics
    ? [
        { key: 'today', label: t('admin.traffic.today'), data: analytics.today },
        { key: 'week', label: t('admin.traffic.last7Days'), data: analytics.last7Days },
        { key: 'month', label: t('admin.traffic.last30Days'), data: analytics.last30Days },
      ]
    : [];

  const recentDaily = analytics?.daily.slice(0, 7) ?? [];

  return (
    <AdminShell className="max-w-4xl">
      <Link href="/admin/dashboard" className={`${adminLinkBack} mb-6 inline-flex`}>
        <ArrowLeft size={16} aria-hidden />
        {t('admin.traffic.back')}
      </Link>

      <AdminPageHeader title={t('admin.traffic.title')} description={t('admin.traffic.description')} />

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-muted">
          <Loader2 size={18} className="animate-spin" aria-hidden />
          {t('admin.traffic.loading')}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      {!loading && !error && analytics && (
        <>
          <div className="mb-4 grid gap-[18px] sm:grid-cols-3">
            {periodCards.map(({ key, label, data }) => (
              <div key={key} className={`${adminCard} p-5`}>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  {label}
                </p>
                <div className="mb-2 flex items-start gap-2">
                  <Eye size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="font-display text-2xl font-semibold tabular-nums text-ink">
                      {formatCount(data.uniques, locale)}
                    </p>
                    <p className="text-[11px] text-ink-muted">{t('admin.traffic.visitors')}</p>
                  </div>
                </div>
                <p className="text-sm tabular-nums text-ink-muted">
                  {formatCount(data.requests, locale)}{' '}
                  <span className="text-ink-faint">{t('admin.traffic.requests')}</span>
                </p>
              </div>
            ))}
          </div>

          {recentDaily.length > 0 && (
            <div className={`${adminCard} overflow-hidden`}>
              <p className="border-b border-[var(--border)] px-4 py-3 text-sm font-medium text-ink">
                {t('admin.traffic.dailyBreakdown')}
              </p>
              <ul className="divide-y divide-[var(--border)]">
                {recentDaily.map((day) => (
                  <li
                    key={day.date}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                  >
                    <span className="text-ink-muted">{formatDayLabel(day.date, locale)}</span>
                    <span className="tabular-nums text-ink">
                      {formatCount(day.uniques, locale)}{' '}
                      <span className="text-ink-faint">{t('admin.traffic.visitors')}</span>
                      <span className="mx-2 text-ink-faint">·</span>
                      {formatCount(day.requests, locale)}{' '}
                      <span className="text-ink-faint">{t('admin.traffic.requests')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-xs text-ink-faint">{t('admin.traffic.sourceNote')}</p>
        </>
      )}
    </AdminShell>
  );
};

export default TrafficPage;
