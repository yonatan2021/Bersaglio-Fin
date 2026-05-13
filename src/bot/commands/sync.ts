import { BotContext } from '../types.js';
import { ScraperService } from '../../services/ScraperService.js';

export async function syncCommand(ctx: BotContext): Promise<void> {
  await ctx.reply('מסנכרן עם הבנק... ⏳');

  const scraper = ScraperService.getInstance();
  const result = await scraper.fetchAllTransactions();

  if (!result.success) {
    await ctx.reply('שגיאה בסנכרון. בדוק את הלוגים.');
    return;
  }

  const lines = result.results.map(r => {
    if (r.success) {
      const transactionCount = r.accounts
        ? r.accounts.reduce(
            (sum: number, acc: { txns?: any[] }) => sum + (acc.txns?.length ?? 0),
            0
          )
        : 0;
      return `✅ ${r.friendlyName}: ${transactionCount} עסקאות חדשות`;
    }
    return `❌ ${r.friendlyName}: שגיאה`;
  });

  await ctx.reply(`סנכרון הסתיים!\n\n${lines.join('\n')}`);
}
