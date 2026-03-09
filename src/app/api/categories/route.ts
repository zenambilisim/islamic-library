import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/books';
import { convertSupabaseCategoryToCategory } from '@/lib/converters-server';

/**
 * GET /api/categories
 */
export async function GET() {
  try {
    const { categories: rawCategories, error } = await getCategories();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const categories = (rawCategories || []).map(convertSupabaseCategoryToCategory);

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('API GET /api/categories error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
