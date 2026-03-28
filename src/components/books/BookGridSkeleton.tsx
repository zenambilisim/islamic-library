'use client';

type BookGridSkeletonProps = {
  count?: number;
  className?: string;
};

export default function BookGridSkeleton({
  count = 10,
  className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch',
}: BookGridSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg"
        >
          <div className="aspect-[2/3] shrink-0 animate-pulse bg-gray-200" />
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="h-7 w-[80%] animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="min-h-[4.5rem] flex-1 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-auto flex gap-2 pt-2">
              <div className="h-9 w-14 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-9 w-14 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
