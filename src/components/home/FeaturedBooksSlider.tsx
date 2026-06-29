'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, BookOpen, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Book } from '@/types';
import { useBookModal } from '@/contexts/BookModalContext';
import { resolveAuthorDisplayName } from '@/lib/author-display-name';

const GRADIENTS: [string, string][] = [
  ['#1F4737', '#0E2820'],
  ['#5A1F2A', '#2A0E13'],
  ['#205A5F', '#0E2A2D'],
  ['#2E3A5F', '#13182D'],
  ['#A67234', '#5C3E18'],
];

function gradientForBook(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[hash]!;
}

interface FeaturedBooksSliderProps {
  books: Book[];
}

const FeaturedBooksSlider = ({ books }: FeaturedBooksSliderProps) => {
  const { t } = useTranslation();
  const { openDetails, openReader } = useBookModal();
  const featured = useMemo(
    () => books.filter((b) => b.coverImage).slice(0, 5),
    [books],
  );
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (featured.length <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [paused, featured.length]);

  if (featured.length === 0) return null;

  const go = (n: number) => setIdx((n + featured.length) % featured.length);

  return (
    <div
      className="relative isolate h-[360px] overflow-hidden rounded-editorial border border-[var(--border)] shadow-card md:h-[420px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {featured.map((book, i) => {
        const [c1, c2] = gradientForBook(book.id);
        const active = i === idx;
        return (
          <div
            key={book.id}
            className={`absolute inset-0 grid grid-cols-1 gap-6 px-7 py-8 transition-all duration-700 md:grid-cols-[1fr_220px] md:px-12 md:py-11 ${
              active
                ? 'pointer-events-auto translate-x-0 opacity-100'
                : 'pointer-events-none translate-x-5 opacity-0'
            }`}
            aria-hidden={!active}
          >
            <div
              className="absolute inset-0 -z-20"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            />
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12), transparent 50%), linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.25))',
              }}
            />

            <div className="relative z-10 flex flex-col justify-center text-[#FBF6E8]">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {t('hero.featuredEyebrow')}
              </p>
              <h2 className="font-display text-3xl font-medium leading-tight tracking-tight md:text-5xl">
                {book.title}
              </h2>
              {book.author?.trim() && (
                <p className="mt-2 text-sm text-white/75">
                  {resolveAuthorDisplayName(book.author, t)}
                </p>
              )}
              {book.description && (
                <p className="mt-4 max-w-lg border-l-2 border-white/35 pl-4 text-sm italic leading-relaxed text-white/90 line-clamp-3">
                  {book.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => openReader(book)}
                  className="inline-flex h-[42px] items-center gap-2 rounded-full bg-[#FBF6E8] px-5 text-sm font-semibold text-[#1A1A1A] transition-transform hover:-translate-y-px"
                >
                  <BookOpen size={15} />
                  {t('common.read')}
                </button>
                <button
                  type="button"
                  onClick={() => openDetails(book)}
                  className="inline-flex h-[42px] items-center gap-2 rounded-full border border-white/22 bg-white/10 px-5 text-sm font-semibold text-[#FBF6E8] backdrop-blur-sm transition-colors hover:bg-white/18"
                >
                  <Sparkles size={15} />
                  {t('hero.featuredDetails')}
                </button>
              </div>
            </div>

            <div className="relative z-10 hidden justify-end self-center md:flex">
              <img
                src={book.coverImage}
                alt=""
                className="w-[200px] rotate-3 rounded-lg shadow-[0_24px_50px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        );
      })}

      {featured.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-[#FBF6E8] backdrop-blur-sm transition-colors hover:bg-black/50"
            onClick={() => go(idx - 1)}
            aria-label={t('hero.sliderPrev')}
          >
            <ChevronDown size={18} className="rotate-90" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-[#FBF6E8] backdrop-blur-sm transition-colors hover:bg-black/50"
            onClick={() => go(idx + 1)}
            aria-label={t('hero.sliderNext')}
          >
            <ChevronDown size={18} className="-rotate-90" />
          </button>
          <div className="absolute bottom-5 left-10 z-20 flex gap-1.5 md:left-12">
            {featured.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={`h-2 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-[#FBF6E8]' : 'w-2 bg-white/35 hover:bg-white/60'
                }`}
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}`}
              />
            ))}
          </div>
          <div className="font-display absolute bottom-5 right-10 z-20 text-sm tabular-nums tracking-wide text-white/80 md:right-12">
            {String(idx + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
          </div>
        </>
      )}
    </div>
  );
};

export default FeaturedBooksSlider;
