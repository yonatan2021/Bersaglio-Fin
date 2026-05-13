import { NextResponse } from 'next/server';
import { getEncryptionKey } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const key = await getEncryptionKey();
  return NextResponse.json({ unlocked: key !== null });
}
