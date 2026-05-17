import type { ReadingStatus } from '@/types';
import { supabaseWithUserToken } from './user-auth';

const VALID_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'read'];

export function isValidReadingStatus(value: string): value is ReadingStatus {
  return VALID_STATUSES.includes(value as ReadingStatus);
}

export async function listUserBookEntries(
  userId: string,
  accessToken: string,
  status?: ReadingStatus
) {
  const client = supabaseWithUserToken(accessToken);
  let query = client
    .from('user_book_entries')
    .select('book_id, status, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  return { entries: data ?? [], error };
}

export async function setUserBookStatus(
  userId: string,
  accessToken: string,
  bookId: string,
  status: ReadingStatus
) {
  const client = supabaseWithUserToken(accessToken);
  const { data, error } = await client
    .from('user_book_entries')
    .upsert(
      {
        user_id: userId,
        book_id: bookId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,book_id' }
    )
    .select('book_id, status, updated_at')
    .single();

  return { entry: data, error };
}

export async function removeUserBookEntry(userId: string, accessToken: string, bookId: string) {
  const client = supabaseWithUserToken(accessToken);
  const { error } = await client
    .from('user_book_entries')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);

  return { error };
}

export async function getUserBookStatusMap(
  userId: string,
  accessToken: string,
  bookIds: string[]
): Promise<Record<string, ReadingStatus>> {
  if (bookIds.length === 0) return {};

  const client = supabaseWithUserToken(accessToken);
  const { data, error } = await client
    .from('user_book_entries')
    .select('book_id, status')
    .eq('user_id', userId)
    .in('book_id', bookIds);

  if (error || !data) return {};

  const map: Record<string, ReadingStatus> = {};
  for (const row of data) {
    if (isValidReadingStatus(row.status)) {
      map[row.book_id] = row.status;
    }
  }
  return map;
}

export async function getBookStatusForUser(
  userId: string,
  bookId: string,
  accessToken: string
): Promise<ReadingStatus | null> {
  const client = supabaseWithUserToken(accessToken);
  const { data, error } = await client
    .from('user_book_entries')
    .select('status')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();

  if (error || !data?.status || !isValidReadingStatus(data.status)) {
    return null;
  }
  return data.status;
}
