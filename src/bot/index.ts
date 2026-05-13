import 'dotenv/config';
import { Bot } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { BotContext } from './types.js';
import { authMiddleware } from './middleware/auth.js';
import { createSessionMiddleware } from './middleware/session.js';
import { DatabaseFactory } from '../services/DatabaseFactory.js';
import { accountsCommand } from './commands/accounts.js';
import { budgetCommand } from './commands/budget.js';
import { reportCommand } from './commands/report.js';
import { syncCommand } from './commands/sync.js';
import { addCommand } from './commands/add.js';
import { addExpenseConversation } from './conversations/addExpense.js';

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
bot.use(createConversation(addExpenseConversation));
bot.use(authMiddleware);

// /start command — placeholder until Phase 5 adds the full menu
bot.command('start', async ctx => {
  await ctx.reply('ברוך הבא! 👋\nאני הבוט הפיננסי שלך.\nשלח /help לרשימת הפקודות.');
});

// Register commands
bot.command('accounts', accountsCommand);
bot.command('budget', budgetCommand);
bot.command('report', reportCommand);
bot.command('sync', syncCommand);
bot.command('add', addCommand);

// Initialize DB then start bot
(async () => {
  const db = DatabaseFactory.getInstance();
  await db.initialize();

  bot
    .start({
      onStart: () => console.warn('Bot is running...'),
    })
    .catch(err => {
      console.error('Bot failed to start:', err);
      process.exit(1);
    });
})();
