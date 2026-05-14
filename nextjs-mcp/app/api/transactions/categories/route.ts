import { NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const rows = await db!.query(
    `SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND category != '' ORDER BY category`,
    []
  );
  const categories = rows.map((r: { category: string }) => r.category);
  return NextResponse.json({ categories });
}
