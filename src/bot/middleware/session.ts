import { session } from 'grammy';
import { SessionData, BotContext } from '../types.js';

export function createSessionMiddleware() {
  return session<SessionData, BotContext>({
    initial: (): SessionData => ({}),
  });
}
