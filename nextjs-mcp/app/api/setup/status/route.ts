import { NextResponse } from 'next/server';
import { getDbInstance } from '@main-src/services/DatabaseService.js';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDbInstance();
  const exists = await db.databaseExists();
  return NextResponse.json({ initialized: exists });
}
