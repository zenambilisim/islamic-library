'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  MoreHorizontal,
  Paperclip,
  Mic,
  Plus,
  Sparkles,
  Sun,
  Search,
  Sprout,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Book } from '@/types';
import { useBookModal } from '@/contexts/BookModalContext';
import { resolveAuthorDisplayName } from '@/lib/author-display-name';
import {
  buildGenericResponse,
  buildQuickPromptResponse,
  matchPromptFromText,
  QUICK_PROMPTS,
  type ChatBlock,
  type ChatMessage,
  type QuickPromptId,
} from '@/lib/hikme-chat';

const PROMPT_ICONS = {
  book: BookOpen,
  search: Search,
  sun: Sun,
  seedling: Sprout,
} as const;

interface HikmeChatPanelProps {
  books: Book[];
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

function MessageBlocks({
  blocks,
  books,
  onOpenBook,
}: {
  blocks: ChatBlock[];
  books: Book[];
  onOpenBook: (book: Book) => void;
}) {
  const { t } = useTranslation();
  const bookMap = new Map(books.map((b) => [b.id, b]));

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'text') {
          return (
            <div key={i} className="whitespace-pre-wrap">
              {block.content}
            </div>
          );
        }
        if (block.type === 'arabic') {
          return (
            <span key={i} className="font-arabic my-2 block text-[19px] leading-relaxed text-accent">
              {block.content}
            </span>
          );
        }
        if (block.type === 'tag') {
          return (
            <span
              key={i}
              className="mb-2 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent"
            >
              {block.content}
            </span>
          );
        }
        if (block.type === 'books') {
          const cited = block.bookIds.map((id) => bookMap.get(id)).filter(Boolean) as Book[];
          return (
            <div key={i} className="mt-2.5 flex flex-col gap-2">
              {cited.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onOpenBook(book)}
                  className="cite-card flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elev)] p-2.5 text-left transition-all hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-soft"
                >
                  <div className="h-[60px] w-[44px] shrink-0 overflow-hidden rounded-md bg-[var(--surface-2)]">
                    <img
                      src={book.coverImage || '/placeholder-book.svg'}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink">
                      {book.title}
                    </p>
                    {book.author?.trim() && (
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] text-ink-muted">
                        {resolveAuthorDisplayName(book.author, t)}
                      </p>
                    )}
                    {book.category && (
                      <span className="mt-1 inline-block rounded-full bg-accent-soft px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-accent">
                        {book.category}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-cream">
                    {t('hikme.open')}
                  </span>
                </button>
              ))}
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

const HikmeChatPanel = ({ books, isMobile, onClose, className = '' }: HikmeChatPanelProps) => {
  const { t } = useTranslation();
  const { openDetails } = useBookModal();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight + 200;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, scrollToBottom]);

  const pushAi = (blocks: ChatBlock[]) => {
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, { role: 'ai', blocks }]);
    }, 1100);
  };

  const sendPrompt = (promptId: QuickPromptId, customText?: string) => {
    const userText = customText ?? t(`hikme.prompts.${promptId}.userText`);
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    pushAi(buildQuickPromptResponse(promptId, books, t));
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);

    const matched = matchPromptFromText(text);
    if (matched) {
      pushAi(buildQuickPromptResponse(matched, books, t));
    } else {
      pushAi(buildGenericResponse(books, t));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`chat-panel flex h-full min-h-0 flex-col overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--chat-bg)] shadow-soft ${className}`}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elev)] px-5 py-4">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-800 text-white">
          <Sparkles size={20} strokeWidth={1.4} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-elev)] bg-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] font-semibold leading-tight text-ink">Hikme</p>
          <p className="text-[11px] tracking-wide text-ink-muted">{t('hikme.status')}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="icon-btn grid h-8 w-8 place-items-center rounded-[9px] border border-[var(--border)] text-ink"
            title={t('hikme.newChat')}
          >
            <Plus size={15} />
          </button>
          {isMobile ? (
            <button
              type="button"
              onClick={onClose}
              className="icon-btn grid h-8 w-8 place-items-center rounded-[9px] border border-[var(--border)] text-ink"
              title={t('common.close')}
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn grid h-8 w-8 place-items-center rounded-[9px] border border-[var(--border)] text-ink"
              title={t('hikme.more')}
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={bodyRef}
        className="chat-body flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
      >
        {messages.length === 0 && (
          <>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <p className="font-arabic mb-1.5 text-[22px] leading-relaxed text-accent">
                {t('hikme.greet.arabic')}
              </p>
              <p className="font-display text-[19px] font-semibold tracking-tight text-ink">
                {t('hikme.greet.title')}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                {t('hikme.greet.text')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map(({ id, icon }) => {
                const Icon = PROMPT_ICONS[icon] ?? BookOpen;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => sendPrompt(id)}
                    className="quick-prompt flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left transition-all hover:-translate-y-px hover:border-accent hover:bg-[var(--bg-elev)]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-soft text-accent">
                      <Icon size={15} />
                    </span>
                    <span className="text-[12.5px] font-semibold leading-snug text-ink">
                      {t(`hikme.prompts.${id}.label`)}
                    </span>
                    <span className="text-[10.5px] leading-snug text-ink-faint">
                      {t(`hikme.prompts.${id}.sub`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="msg user flex max-w-[92%] flex-col items-end gap-1 self-end">
              <div className="msg-bubble rounded-[18px] rounded-br-md bg-ink px-4 py-3 text-[13.5px] leading-relaxed text-cream">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} className="msg ai flex max-w-[92%] flex-col self-start">
              <div className="msg-bubble rounded-[18px] rounded-bl-md border border-[var(--border)] bg-[var(--chat-ai)] px-4 py-3 text-[13.5px] leading-relaxed text-ink">
                <MessageBlocks blocks={msg.blocks} books={books} onOpenBook={openDetails} />
              </div>
            </div>
          ),
        )}

        {thinking && (
          <div className="msg ai self-start">
            <div className="typing flex w-fit gap-1 rounded-[18px] rounded-bl-md border border-[var(--border)] bg-[var(--chat-ai)] px-4 py-3.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-elev)] px-4 pb-4 pt-3.5">
        <div className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 focus-within:border-accent">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('hikme.placeholder')}
            rows={1}
            className="max-h-[100px] min-h-[22px] flex-1 resize-none border-none bg-transparent py-2 text-[13.5px] leading-snug text-ink outline-none placeholder:text-ink-faint"
          />
          <div className="flex shrink-0 gap-1 pb-0.5">
            <button type="button" className="chat-tool grid h-8 w-8 place-items-center rounded-[9px] text-ink-muted hover:bg-[var(--surface-2)] hover:text-ink">
              <Paperclip size={16} />
            </button>
            <button type="button" className="chat-tool grid h-8 w-8 place-items-center rounded-[9px] text-ink-muted hover:bg-[var(--surface-2)] hover:text-ink">
              <Mic size={16} />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="send-btn grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-accent text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10.5px] tracking-wide text-ink-faint">
          {t('hikme.footerNote')}
        </p>
      </div>
    </div>
  );
};

export default HikmeChatPanel;
