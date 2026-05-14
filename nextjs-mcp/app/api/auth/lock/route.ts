import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { encryptionKeyService } from '@main-src/services/EncryptionKeyService';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getSession();
  session.encryptionKey = undefined;
  session.unlockedAt = undefined;
  await session.save();
  encryptionKeyService.clearKey();
  return NextResponse.json({ ok: true });
}
