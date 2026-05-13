import { BotContext } from '../types.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';
import { formatCurrency } from '../helpers/format.js';

export async function budgetCommand(ctx: BotContext): Promise<void> {
  try {
    const db = DatabaseFactory.getInstance();

    // Get configured budgets
    const budgetResult = await db.getBudgets();
    if (!budgetResult.success || !budgetResult.data || budgetResult.data.length === 0) {
      await ctx.reply('אין תקציבים מוגדרים.\nהגדר תקציבים דרך הדשבורד.');
      return;
    }

    // Get current month spending per category
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, now.getMonth() + 1, 1).toISOString().slice(0, 10);

    // No user input in this query — interpolation is safe
    const spendingResult = await db.executeSafeSelectQuery(`
      SELECT
        COALESCE(category, 'ללא קטגוריה') as category,
        SUM(chargedAmount) as total
      FROM transactions
      WHERE date >= '${startDate}' AND date < '${endDate}' AND chargedAmount > 0
      GROUP BY COALESCE(category, 'ללא קטגוריה')
    `);

    const spendingMap = new Map<string, number>();
    if (!spendingResult.success) {
      await ctx.reply('שגיאה בטעינת נתוני ההוצאות. נסה שוב.');
      return;
    }
    if (spendingResult.data) {
      for (const row of spendingResult.data as Array<{ category: string; total: number }>) {
        spendingMap.set(row.category, row.total);
      }
    }

    const lines = budgetResult.data.map(budget => {
      const spent = spendingMap.get(budget.category) ?? 0;
      const limit = budget.monthly_limit;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const status = pct >= 100 ? '🔴' : pct >= 80 ? '🟡' : '🟢';
      return `${status} ${budget.category}: ${formatCurrency(spent)} / ${formatCurrency(limit)} (${pct}%)`;
    });

    await ctx.reply(`💰 תקציב חודשי — ${month}/${year}\n\n${lines.join('\n')}`);
  } catch {
    await ctx.reply('שגיאה בטעינת התקציב. נסה שוב.');
  }
}
