import { Context, SessionFlavor } from 'grammy';
import { ConversationFlavor } from '@grammyjs/conversations';

export interface SessionData {
  // in-memory session — empty for now, conversations plugin uses it internally
}

type BaseContext = Context & SessionFlavor<SessionData>;

export type BotContext = ConversationFlavor<BaseContext>;
