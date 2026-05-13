import { BotContext } from '../types.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';

export async function accountsCommand(ctx: BotContext): Promise<void> {
  try {
    const db = DatabaseFactory.getInstance();
    const credentials = await db.getScraperCredentials();

    if (credentials.length === 0) {
      await ctx.reply('אין חשבונות מחוברים.\nהוסף חשבון בנק דרך הדשבורד.');
      return;
    }

    const lines = credentials.map(
      ({ friendly_name, scraper_type }, i) => `${i + 1}. ${friendly_name} (${scraper_type})`
    );
    await ctx.reply(`חשבונות מחוברים:\n\n${lines.join('\n')}`);
  } catch {
    await ctx.reply('שגיאה בטעינת החשבונות. נסה שוב.');
  }
}
