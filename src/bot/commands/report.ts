import { BotContext } from '../types.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';
import { formatCurrency } from '../helpers/format.js';

export async function reportCommand(ctx: BotContext): Promise<void> {
  try {
    const db = DatabaseFactory.getInstance();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    // Use first day of next month for an unambiguous upper bound
    const endDate = new Date(year, now.getMonth() + 1, 1).toISOString().slice(0, 10);

    // No user input in this query — interpolation is safe here
    const result = await db.executeSafeSelectQuery(`
      SELECT
        COALESCE(category, 'ללא קטגוריה') as category,
        SUM(chargedAmount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= '${startDate}' AND date < '${endDate}'
      GROUP BY COALESCE(category, 'ללא קטגוריה')
      ORDER BY total DESC
    `);

    if (!result.success || !result.data || result.data.length === 0) {
      await ctx.reply(`אין הוצאות לחודש ${month}/${year}.`);
      return;
    }

    const totalAll = (
      result.data as Array<{ category: string; total: number; count: number }>
    ).reduce((sum, row) => sum + row.total, 0);
    const lines = (result.data as Array<{ category: string; total: number; count: number }>).map(
      row => `${row.category}: ${formatCurrency(row.total)} (${row.count} עסקאות)`
    );

    await ctx.reply(
      `📊 דוח חודשי — ${month}/${year}\n\n${lines.join('\n')}\n\nסה"כ: ${formatCurrency(totalAll)}`
    );
  } catch {
    await ctx.reply('שגיאה בטעינת הדוח. נסה שוב.');
  }
}
