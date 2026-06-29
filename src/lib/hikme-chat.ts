export type ChatBlock =
  | { type: 'text'; content: string }
  | { type: 'arabic'; content: string }
  | { type: 'tag'; content: string }
  | { type: 'books'; bookIds: string[] };

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'ai'; blocks: ChatBlock[] };

export type ChatHistoryTurn = { role: 'user' | 'assistant'; content: string };

export function blocksToAssistantText(blocks: ChatBlock[]): string {
  return blocks
    .filter((b): b is Extract<ChatBlock, { type: 'text' }> => b.type === 'text')
    .map((b) => b.content)
    .join('\n\n');
}

export function messagesToHistory(messages: ChatMessage[]): ChatHistoryTurn[] {
  return messages
    .map((msg) => {
      if (msg.role === 'user') {
        return { role: 'user' as const, content: msg.text };
      }
      const content = blocksToAssistantText(msg.blocks);
      return content ? { role: 'assistant' as const, content } : null;
    })
    .filter((item): item is ChatHistoryTurn => item !== null);
}

export async function fetchChatResponse(params: {
  message: string;
  language?: string;
  history?: ChatHistoryTurn[];
}): Promise<ChatBlock[]> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await res.json().catch(() => ({}))) as {
    blocks?: ChatBlock[];
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? 'Chat request failed');
  }
  if (!Array.isArray(data.blocks)) {
    throw new Error('Invalid chat response');
  }
  return data.blocks;
}
