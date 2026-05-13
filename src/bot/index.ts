import 'dotenv/config';
import { Bot } from 'grammy';
import { conversations } from '@grammyjs/conversations';
import { BotContext } from './types.js';
import { authMiddleware } from './middleware/auth.js';
import { createSessionMiddleware } from './middleware/session.js';

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN is required in .env');
}

if (!process.env.ALLOWED_TELEGRAM_IDS) {
  throw new Error('ALLOWED_TELEGRAM_IDS is required in .env');
}

const bot = new Bot<BotContext>(token);

// Middleware (order matters)
bot.use(createSessionMiddleware());
bot.use(conversations());
bot.use(authMiddleware);

// /start command — placeholder until Phase 5 adds the full menu
bot.command('start', async (ctx) => {
  await ctx.reply('ברוך הבא! 👋\nאני הבוט הפיננסי שלך.\nשלח /help לרשימת הפקודות.');
});

bot.start({
  onStart: () => console.log('Bot is running...'),
}).catch((err) => {
  console.error('Bot failed to start:', err);
  process.exit(1);
});
