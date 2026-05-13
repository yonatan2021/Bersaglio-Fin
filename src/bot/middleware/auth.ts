import { BotContext } from '../types.js';
import { NextFunction } from 'grammy';

export async function authMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const allowed =
    process.env.ALLOWED_TELEGRAM_IDS?.split(',').map((id) => parseInt(id.trim(), 10)) ?? [];
  const userId = ctx.from?.id;

  if (!userId || !allowed.includes(userId)) {
    return; // silently ignore — no reply to strangers
  }

  await next();
}
