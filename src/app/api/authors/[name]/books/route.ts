import { NextRequest, NextResponse } from 'next/server';
import { getBooksByAuthor } from '@/lib/authors';

/**
 * GET /api/authors/[name]/books
 * Query: language (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    if (!decodedName) {
      return NextResponse.json({ error: 'Missing author name' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || undefined;

    const { books, error } = await getBooksByAuthor(decodedName, language);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ books });
  } catch (err) {
    console.error('API GET /api/authors/[name]/books error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
