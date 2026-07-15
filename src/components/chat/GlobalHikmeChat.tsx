'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Book } from '@/types';
import HikmeChatPanel from '@/components/chat/HikmeChatPanel';
import ChatPearl from '@/components/chat/ChatPearl';

interface ChatBooksContextValue {
  getBooksByIds: (ids: string[]) => Promise<Book[]>;
}

const ChatBooksContext = createContext<ChatBooksContextValue>({
  getBooksByIds: async () => [],
});

export function useChatBooks() {
  return useContext(ChatBooksContext);
}

/** In-memory cache ile kitapları ID'ye göre talep üzerine çeker. */
export function HikmeChatBooksProvider({ children }: { children: ReactNode }) {
  const cacheRef = useRef<Map<string, Book>>(new Map());

  const getBooksByIds = useCallback(async (ids: string[]): Promise<Book[]> => {
    const cache = cacheRef.current;
    const missing = ids.filter((id) => !cache.has(id));

    if (missing.length > 0) {
      try {
        const res = await fetch(`/api/books?ids=${missing.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          const books: Book[] = Array.isArray(data.books) ? data.books : [];
          for (const book of books) {
            cache.set(book.id, book);
          }
        }
      } catch {
        // cache'de olanlarla devam et
      }
    }

    return ids.map((id) => cache.get(id)).filter(Boolean) as Book[];
  }, []);

  return (
    <ChatBooksContext.Provider value={{ getBooksByIds }}>
      {children}
    </ChatBooksContext.Provider>
  );
}

export function GlobalHikmeChatSidebar() {
  return (
    <aside className="site-chat-column" aria-label="Hikme chat">
      <HikmeChatPanel className="h-full" />
    </aside>
  );
}

export function GlobalHikmeChatMobile() {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  return (
    <>
      <ChatPearl onClick={() => setMobileChatOpen(true)} />
      {mobileChatOpen && (
        <div className="mobile-chat-overlay fixed inset-0 z-[100] flex flex-col bg-cream p-3 pt-[calc(var(--header-h)+8px)] min-[1180px]:hidden">
          <HikmeChatPanel
            isMobile
            onClose={() => setMobileChatOpen(false)}
            className="h-full"
          />
        </div>
      )}
    </>
  );
}
