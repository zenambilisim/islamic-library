'use client';

import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatPearlProps {
  onClick: () => void;
}

const ChatPearl = ({ onClick }: ChatPearlProps) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('hikme.openChat')}
      className="pearl fixed bottom-6 right-6 z-[80] hidden h-16 w-16 place-items-center overflow-hidden rounded-full bg-ink text-cream shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 max-[1179px]:grid dark:bg-accent dark:text-accent-fg"
    >
      <span
        className="pointer-events-none absolute inset-[-4px] animate-ping rounded-full border-2 border-accent opacity-60"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_50%)]"
        aria-hidden
      />
      <Sparkles size={26} strokeWidth={1.4} className="relative z-10" />
    </button>
  );
};

export default ChatPearl;
