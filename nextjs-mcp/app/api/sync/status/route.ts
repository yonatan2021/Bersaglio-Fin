import { NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const row = db!.readSyncState();
  return NextResponse.json({
    status: row?.status ?? 'idle',
    startedAt: row?.started_at,
    completedAt: row?.completed_at,
    results: row?.results ? JSON.parse(row.results) : null,
    error: row?.error,
  });
}
