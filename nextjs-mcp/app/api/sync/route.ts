import { NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';
import { scraperService } from '@main-src/services/ScraperService.js';

export const runtime = 'nodejs';

export async function POST() {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  // Atomic: UPDATE WHERE status != 'running'. If returns false, already running.
  const started = db!.startSyncAtomic(new Date().toISOString());
  if (!started) {
    return NextResponse.json({ error: 'Sync already running' }, { status: 409 });
  }

  // Capture db reference BEFORE the async launch — avoids getDbInstance() in callback
  // which could land on a different worker instance with no key set.
  // SQLite connection stays open for process lifetime; queries don't re-check the encryption key.
  const capturedDb = db!;

  scraperService
    .fetchAllTransactions()
    .then(result => {
      capturedDb.writeSyncState({
        status: result.success ? 'done' : 'error',
        completed_at: new Date().toISOString(),
        results: JSON.stringify(result.results),
        error: null,
      });
    })
    .catch(err => {
      capturedDb.writeSyncState({
        status: 'error',
        completed_at: new Date().toISOString(),
        results: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    });

  return NextResponse.json({ ok: true, message: 'Sync started' });
}
