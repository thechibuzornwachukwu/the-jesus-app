import { NextRequest, NextResponse } from 'next/server';
import { searchBible } from '@/lib/bible';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  const result = await searchBible(query);
  return NextResponse.json(result);
}
