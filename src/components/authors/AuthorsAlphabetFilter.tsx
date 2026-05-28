'use client';

import { useTranslation } from 'react-i18next';

interface AuthorsAlphabetFilterProps {
  alphabet: string[];
  availableLetters: string[];
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
}

const AuthorsAlphabetFilter = ({
  alphabet,
  availableLetters,
  selectedLetter,
  onSelectLetter,
}: AuthorsAlphabetFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft">
      <p className="mb-3 text-[12.5px] font-medium text-ink-muted">{t('authors.alphabetSort')}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onSelectLetter(null)}
          className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full px-3 text-[12.5px] font-medium transition-colors ${
            !selectedLetter
              ? 'bg-ink text-cream'
              : 'border border-[var(--border)] bg-[var(--surface)] text-ink-muted hover:text-ink'
          }`}
        >
          {t('authors.all')}
        </button>
        {alphabet.map((letter) => {
          const isAvailable = availableLetters.includes(letter);
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => isAvailable && onSelectLetter(letter)}
              disabled={!isAvailable}
              className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2.5 text-[12.5px] font-medium transition-colors ${
                isSelected
                  ? 'bg-ink text-cream'
                  : isAvailable
                    ? 'border border-[var(--border)] bg-[var(--surface)] text-ink hover:bg-[var(--surface-2)]'
                    : 'cursor-not-allowed border border-transparent bg-cream-200/50 text-ink-faint'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AuthorsAlphabetFilter;
