import { BotContext } from '../types.js';
import { NextFunction } from 'grammy';

const ALLOWED_IDS = (process.env.ALLOWED_TELEGRAM_IDS ?? '')
  .split(',')
  .map(id => parseInt(id.trim(), 10))
  .filter(id => !isNaN(id));

export async function authMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const userId = ctx.from?.id;

  if (!userId || !ALLOWED_IDS.includes(userId)) {
    return;
  }

  await next();
}
