import { NextRequest, NextResponse } from 'next/server';
import { getAuthorById } from '@/lib/authors';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing author id' }, { status: 400 });
    const { author, error } = await getAuthorById(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!author) return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    return NextResponse.json(author);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
