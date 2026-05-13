import { BotContext } from '../types.js';

export async function addCommand(ctx: BotContext): Promise<void> {
  await ctx.conversation.enter('addExpenseConversation');
}
