import { NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const totalRows = await db!.query<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(chargedAmount), 0) as total, COUNT(*) as count
     FROM transactions WHERE date >= ? AND date < ? AND chargedAmount > 0`,
    [firstOfMonth, firstOfNext]
  );
  const totalRow = totalRows[0];

  const categories = await db!.query<{ category: string; total: number }>(
    `SELECT COALESCE(category, 'אחר') as category, SUM(chargedAmount) as total
     FROM transactions WHERE date >= ? AND date < ? AND chargedAmount > 0
     GROUP BY category ORDER BY total DESC LIMIT 5`,
    [firstOfMonth, firstOfNext]
  );

  const recent = await db!.query(
    `SELECT t.*, sc.friendly_name FROM transactions t
     JOIN scraper_credentials sc ON t.scraper_credential_id = sc.id
     ORDER BY t.date DESC LIMIT 30`
  );

  return NextResponse.json({
    monthlyTotal: totalRow?.total ?? 0,
    transactionCount: totalRow?.count ?? 0,
    topCategories: categories,
    recentTransactions: recent,
  });
}
