'use client';

import { ArrowRight, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveAuthorDisplayName } from '@/lib/author-display-name';
import type { Author } from '@/types';

interface AuthorCardProps {
  author: Author;
  onClick: () => void;
  index?: number;
}

const AuthorCard = ({ author, onClick, index = 0 }: AuthorCardProps) => {
  const { t } = useTranslation();
  const displayName = resolveAuthorDisplayName(author.name, t);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full animate-fade-in flex-col rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <User size={20} strokeWidth={1.75} aria-hidden />
        </div>
        <ArrowRight
          size={18}
          className="shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden
        />
      </div>

      <h3 className="font-display text-lg font-medium tracking-tight text-ink transition-colors group-hover:text-accent">
        {displayName}
      </h3>

      {author.biography ? (
        <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-ink-muted">
          {author.biography}
        </p>
      ) : (
        <div className="flex-1" />
      )}

      <p className="mt-4 border-t border-[var(--border)] pt-3 text-[12px] font-medium text-ink-muted">
        <span className="tabular-nums text-ink">{author.bookCount}</span> {t('authors.booksCount')}
      </p>
    </button>
  );
};

export default AuthorCard;
