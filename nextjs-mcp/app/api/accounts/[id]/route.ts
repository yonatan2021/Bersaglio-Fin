import { NextRequest, NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const { id } = await params;
  const deleted = await db!.deleteScraperCredentials(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
