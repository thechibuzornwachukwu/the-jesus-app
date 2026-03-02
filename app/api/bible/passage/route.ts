import { NextRequest, NextResponse } from 'next/server';
import { getBiblePassage } from '@/lib/bible';

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference')?.trim() || '';
  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  const passage = await getBiblePassage(reference);
  if (!passage) {
    return NextResponse.json({ error: 'Passage not found' }, { status: 404 });
  }

  return NextResponse.json({ passage });
}
