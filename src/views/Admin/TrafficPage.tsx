'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';

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
    (async () => {
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline mb-6"
        >
          <ArrowLeft size={16} aria-hidden />
          {t('admin.traffic.back')}
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{t('admin.traffic.title')}</h1>
        <p className="text-gray-600 mb-8">{t('admin.traffic.description')}</p>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
            <Loader2 size={18} className="animate-spin" aria-hidden />
            {t('admin.traffic.loading')}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {!loading && !error && analytics && (
          <>
            <div className="grid gap-4 sm:grid-cols-3 mb-4">
              {periodCards.map(({ key, label, data }) => (
                <div
                  key={key}
                  className="rounded-xl bg-white border border-gray-200 shadow-sm p-5"
                >
                  <p className="text-sm font-medium text-gray-500 mb-3">{label}</p>
                  <div className="flex items-start gap-2 mb-2">
                    <Eye size={18} className="text-primary-600 mt-0.5 shrink-0" aria-hidden />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 tabular-nums">
                        {formatCount(data.uniques, locale)}
                      </p>
                      <p className="text-xs text-gray-500">{t('admin.traffic.visitors')}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 tabular-nums">
                    {formatCount(data.requests, locale)}{' '}
                    <span className="text-gray-400">{t('admin.traffic.requests')}</span>
                  </p>
                </div>
              ))}
            </div>

            {recentDaily.length > 0 && (
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                <p className="text-sm font-medium text-gray-700 px-4 py-3 border-b border-gray-100">
                  {t('admin.traffic.dailyBreakdown')}
                </p>
                <ul className="divide-y divide-gray-100">
                  {recentDaily.map((day) => (
                    <li
                      key={day.date}
                      className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                    >
                      <span className="text-gray-600">{formatDayLabel(day.date, locale)}</span>
                      <span className="text-gray-900 tabular-nums">
                        {formatCount(day.uniques, locale)}{' '}
                        <span className="text-gray-400">{t('admin.traffic.visitors')}</span>
                        <span className="mx-2 text-gray-300">·</span>
                        {formatCount(day.requests, locale)}{' '}
                        <span className="text-gray-400">{t('admin.traffic.requests')}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-400">{t('admin.traffic.sourceNote')}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TrafficPage;
