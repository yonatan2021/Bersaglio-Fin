import { getEncryptionKey } from './session';
import { getDbInstance } from '@main-src/services/DatabaseService';
import { encryptionKeyService } from '@main-src/services/EncryptionKeyService';
import { NextResponse } from 'next/server';

export async function getInitializedDb() {
  const key = await getEncryptionKey();
  if (!key) {
    return { db: null, error: NextResponse.json({ error: 'Locked' }, { status: 401 }) };
  }
  encryptionKeyService.setKey(key);
  const db = getDbInstance();
  await db.initialize();
  return { db, error: null };
}
