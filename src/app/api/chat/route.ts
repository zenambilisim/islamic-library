import { NextRequest, NextResponse } from 'next/server';
import { generateChatBlocks, isChatRagConfigured } from '@/lib/chat-rag';
import type { ChatHistoryTurn } from '@/lib/chat-rag';

const MAX_MESSAGE_LEN = 2000;

function parseHistory(raw: unknown): ChatHistoryTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatHistoryTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string' || !content.trim()) continue;
    out.push({ role, content: content.trim().slice(0, MAX_MESSAGE_LEN) });
  }
  return out;
}

/**
 * POST /api/chat
 * Body: { message, language?, history? }
 */
export async function POST(request: NextRequest) {
  if (!isChatRagConfigured()) {
    return NextResponse.json(
      { success: false, message: 'Chat service is not configured.' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const language = typeof body?.language === 'string' ? body.language : undefined;
    const history = parseHistory(body?.history);

    if (!message) {
      return NextResponse.json({ success: false, message: 'Message is required.' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return NextResponse.json({ success: false, message: 'Message too long.' }, { status: 400 });
    }

    const blocks = await generateChatBlocks({ message, language, history });
    return NextResponse.json({ success: true, blocks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Chat failed';
    console.error('[api/chat]', msg);

    const isTimeout = msg.includes('statement timeout') || msg.includes('canceling statement');
    return NextResponse.json(
      {
        success: false,
        message: isTimeout
          ? 'Search took too long. Please try a shorter or simpler question.'
          : 'Failed to generate a response.',
      },
      { status: isTimeout ? 504 : 502 },
    );
  }
}
