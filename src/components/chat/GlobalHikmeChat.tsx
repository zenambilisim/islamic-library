'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Book } from '@/types';
import { useSupabaseBooks } from '@/hooks/useSupabaseBooks';
import HikmeChatPanel from '@/components/chat/HikmeChatPanel';
import ChatPearl from '@/components/chat/ChatPearl';

const ChatBooksContext = createContext<Book[]>([]);

function useChatBooks() {
  return useContext(ChatBooksContext);
}

/** Kitap listesini bir kez yükler; sidebar + mobil sohbet paylaşır. */
export function HikmeChatBooksProvider({ children }: { children: ReactNode }) {
  const { books } = useSupabaseBooks('uploadDate', { fetchAll: true });
  return <ChatBooksContext.Provider value={books}>{children}</ChatBooksContext.Provider>;
}

export function GlobalHikmeChatSidebar() {
  const books = useChatBooks();

  return (
    <aside className="site-chat-column" aria-label="Hikme chat">
      <HikmeChatPanel books={books} className="h-full" />
    </aside>
  );
}

export function GlobalHikmeChatMobile() {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const books = useChatBooks();

  return (
    <>
      <ChatPearl onClick={() => setMobileChatOpen(true)} />
      {mobileChatOpen && (
        <div className="mobile-chat-overlay fixed inset-0 z-[100] flex flex-col bg-cream p-3 pt-[calc(var(--header-h)+8px)] min-[1180px]:hidden">
          <HikmeChatPanel
            books={books}
            isMobile
            onClose={() => setMobileChatOpen(false)}
            className="h-full"
          />
        </div>
      )}
    </>
  );
}
