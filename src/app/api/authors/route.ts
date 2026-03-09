import { NextResponse } from 'next/server';
import { getAuthors } from '@/lib/authors';

/**
 * GET /api/authors
 */
export async function GET() {
  try {
    const { authors, error } = await getAuthors();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ authors });
  } catch (err) {
    console.error('API GET /api/authors error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
