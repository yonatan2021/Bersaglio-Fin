import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { encryptionKeyService } from '@main-src/services/EncryptionKeyService.js';
import { getDbInstance } from '@main-src/services/DatabaseService.js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { key } = await req.json();
  if (!key || key.length < 6) {
    return NextResponse.json({ error: 'Key must be at least 6 characters' }, { status: 400 });
  }
  try {
    encryptionKeyService.setKey(key);
    const db = getDbInstance();
    await db.initialize();
    const session = await getSession();
    session.encryptionKey = key;
    session.unlockedAt = Date.now();
    await session.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    encryptionKeyService.clearKey();
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to initialize' },
      { status: 500 }
    );
  }
}
