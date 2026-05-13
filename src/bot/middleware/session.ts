import { session } from 'grammy';
import { SessionData } from '../types.js';

export function createSessionMiddleware() {
  return session<SessionData, any>({
    initial: (): SessionData => ({}),
  });
}
