'use client';

type AuthorsGridSkeletonProps = {
  count?: number;
};

const AuthorsGridSkeleton = ({ count = 6 }: AuthorsGridSkeletonProps) => (
  <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft"
      >
        <div className="mb-3 h-10 w-10 animate-pulse rounded-full bg-[var(--surface-3)]" />
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded-lg bg-[var(--surface-3)]" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-[var(--surface-3)]" />
      </div>
    ))}
  </div>
);

export default AuthorsGridSkeleton;
