import { NextRequest, NextResponse } from 'next/server';
import type { ReadingStatus } from '@/types';
import { getBooksByIds } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';
import { getUserFromRequest, getUserTokenFromRequest } from '@/lib/user-auth';
import {
  getBookStatusForUser,
  getUserBookStatusMap,
  isValidReadingStatus,
  listUserBookEntries,
  removeUserBookEntry,
  setUserBookStatus,
} from '@/lib/user-reading-list';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/reading-list?status=want_to_read|reading|read&bookIds=id1,id2
 * - status: filtreli liste + kitap detayları
 * - bookIds: sadece durum haritası (kartlar için)
 */
export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const token = getUserTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookIdsParam = searchParams.get('bookIds');
  if (bookIdsParam) {
    const bookIds = bookIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const statuses = await getUserBookStatusMap(auth.user.id, token, bookIds);
    return NextResponse.json({ statuses });
  }

  const statusParam = searchParams.get('status');
  const status =
    statusParam && isValidReadingStatus(statusParam) ? (statusParam as ReadingStatus) : undefined;

  const bookId = searchParams.get('bookId');
  if (bookId) {
    const singleStatus = await getBookStatusForUser(auth.user.id, bookId, token);
    return NextResponse.json({ bookId, status: singleStatus });
  }

  const { entries, error } = await listUserBookEntries(auth.user.id, token, status);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = entries.map((e) => e.book_id);
  const { books: rawBooks, error: booksError } = await getBooksByIds(ids);
  if (booksError) {
    return NextResponse.json({ error: booksError.message }, { status: 500 });
  }

  const bookMap = new Map(rawBooks.map((b) => [b.id, b]));
  const items = entries
    .map((entry) => {
      const raw = bookMap.get(entry.book_id);
      if (!raw) return null;
      return {
        status: entry.status as ReadingStatus,
        updatedAt: entry.updated_at,
        book: convertSupabaseBookToBook(raw),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}

/**
 * PUT /api/user/reading-list
 * Body: { bookId, status }
 */
export async function PUT(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const token = getUserTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookId = body?.bookId?.trim();
    const status = body?.status;

    if (!bookId || !status || !isValidReadingStatus(status)) {
      return NextResponse.json({ error: 'Geçersiz kitap veya durum.' }, { status: 400 });
    }

    const { entry, error } = await setUserBookStatus(
      auth.user.id,
      token,
      bookId,
      status as ReadingStatus
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      entry: entry
        ? { bookId: entry.book_id, status: entry.status, updatedAt: entry.updated_at }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kaydedilemedi.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/reading-list?bookId=
 */
export async function DELETE(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const token = getUserTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
  }

  const bookId = new URL(request.url).searchParams.get('bookId')?.trim();
  if (!bookId) {
    return NextResponse.json({ error: 'bookId gerekli.' }, { status: 400 });
  }

  const { error } = await removeUserBookEntry(auth.user.id, token, bookId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
