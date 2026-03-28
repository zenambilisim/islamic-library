import { useEffect, useRef } from 'react';

export interface LoadMoreOnScrollOptions {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  enabled?: boolean;
  /**
   * Viewport altuna genişletme — ne kadar erken sonraki sayfa istenir (örn. 1000px).
   * Sadece alt kenar; IntersectionObserver rootMargin ile aynı mantık.
   */
  prefetchPx?: number;
  /** Sentinel yeniden mount olduğunda observer’ı yeniden bağlamak için (ör. kategori ↔ liste) */
  watchKey?: string | number;
}

/**
 * Sentinel viewport’a yaklaşınca loadMore çağırır.
 * loadingMore bittiğinde sentinel hâlâ görünür alandaysa zincirleme bir kez daha dener (IO tek başına bazen yeniden tetiklenmez).
 */
export function useLoadMoreOnScroll(
  loadMore: () => void | Promise<void>,
  {
    hasMore,
    loading,
    loadingMore,
    enabled = true,
    prefetchPx = 1000,
    watchKey,
  }: LoadMoreOnScrollOptions
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const optsRef = useRef({ loading, loadingMore, hasMore, enabled });
  optsRef.current = { loading, loadingMore, hasMore, enabled };

  const rootMargin = `0px 0px ${prefetchPx}px 0px`;

  useEffect(() => {
    if (!enabled || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (!e?.isIntersecting) return;
        const o = optsRef.current;
        if (!o.enabled || !o.hasMore || o.loading || o.loadingMore) return;
        void loadMoreRef.current();
      },
      { root: null, rootMargin, threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, hasMore, watchKey, rootMargin]);

  const wasLoadingMoreRef = useRef(false);

  useEffect(() => {
    const ended = wasLoadingMoreRef.current && !loadingMore;
    wasLoadingMoreRef.current = loadingMore;

    if (!ended || !hasMore || loading) return;

    const el = sentinelRef.current;
    if (!el) return;

    const run = () => {
      const o = optsRef.current;
      if (!o.enabled || !o.hasMore || o.loading || o.loadingMore) return;
      const rect = el.getBoundingClientRect();
      const thresholdY = window.innerHeight + prefetchPx;
      if (rect.top < thresholdY) {
        void loadMoreRef.current();
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [loadingMore, hasMore, loading, prefetchPx, enabled]);

  return sentinelRef;
}
