import { NextRequest, NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const result = await db!.getBudgets();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const spendRows = await db!.query<{ category: string; spent: number }>(
    `SELECT COALESCE(category, 'אחר') as category, SUM(chargedAmount) as spent
     FROM transactions WHERE date >= ? AND date < ? AND chargedAmount > 0
     GROUP BY category`,
    [firstOfMonth, firstOfNext]
  );
  const spendMap = new Map(spendRows.map(r => [r.category, r.spent]));

  const budgets = (result.data ?? []).map(b => ({
    ...b,
    spent: spendMap.get(b.category) ?? 0,
  }));

  const allCategories = await db!.query<{ category: string }>(
    `SELECT DISTINCT COALESCE(category, 'אחר') as category FROM transactions ORDER BY category`
  );

  return NextResponse.json({ budgets, allCategories: allCategories.map(r => r.category) });
}

export async function POST(req: NextRequest) {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const { category, monthly_limit } = await req.json();
  if (!category || typeof monthly_limit !== 'number' || monthly_limit < 0) {
    return NextResponse.json({ error: 'category and monthly_limit (number ≥ 0) required' }, { status: 400 });
  }

  const result = await db!.upsertBudget(category, monthly_limit);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const { category } = await req.json();
  if (!category) return NextResponse.json({ error: 'category required' }, { status: 400 });

  await db!.query('DELETE FROM budgets WHERE category = ?', [category]);
  return NextResponse.json({ ok: true });
}
