import { Menu } from '@grammyjs/menu';
import { BotContext } from '../types.js';
import { reportCommand } from '../commands/report.js';
import { budgetCommand } from '../commands/budget.js';
import { syncCommand } from '../commands/sync.js';
import { accountsCommand } from '../commands/accounts.js';

export const mainMenu = new Menu<BotContext>('main-menu')
  .text('➕ הוסף הוצאה', ctx => ctx.conversation.enter('addExpenseConversation'))
  .row()
  .text('📊 דוח חודשי', async ctx => {
    await reportCommand(ctx);
  })
  .text('💰 תקציב', async ctx => {
    await budgetCommand(ctx);
  })
  .row()
  .text('🔄 סנכרן', async ctx => {
    await syncCommand(ctx);
  })
  .text('🏦 חשבונות', async ctx => {
    await accountsCommand(ctx);
  });
