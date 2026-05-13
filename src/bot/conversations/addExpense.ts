import { Conversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { BotContext } from '../types.js';
import { CATEGORIES } from '../helpers/categories.js';
import { formatCurrency } from '../helpers/format.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';

export type AddExpenseConversation = Conversation<BotContext, BotContext>;

export async function addExpenseConversation(
  conversation: AddExpenseConversation,
  ctx: BotContext
): Promise<void> {
  // Step 1: Ask for amount
  await ctx.reply('כמה שילמת? (שלח סכום בשקלים, לדוגמה: 150 או 49.90)');

  let amount: number | null = null;
  while (amount === null) {
    const amountCtx = await conversation.wait();
    const text = amountCtx.message?.text;
    // Allow cancellation during any step
    if (text && text.startsWith('/') && text !== '/skip') {
      await amountCtx.reply('הפעולה בוטלה. ניתן לשלוח /add כדי להתחיל מחדש.');
      return;
    }
    const parsed = text ? parseFloat(text.replace(',', '.')) : NaN;
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    } else {
      await amountCtx.reply('אנא שלח סכום חוקי (מספר חיובי, לדוגמה: 150)');
    }
  }

  // Step 2: Ask for category via inline keyboard
  const keyboard = new InlineKeyboard();
  CATEGORIES.forEach((cat, i) => {
    keyboard.text(`${cat.emoji} ${cat.hebrewName}`, cat.id);
    if ((i + 1) % 3 === 0) keyboard.row();
  });
  await ctx.reply('באיזה קטגוריה?', { reply_markup: keyboard });

  let category: (typeof CATEGORIES)[0] | undefined;
  while (!category) {
    const categoryCtx = await conversation.wait();

    // Text-based cancel (e.g. user types /cancel instead of tapping keyboard)
    if (categoryCtx.message?.text?.startsWith('/')) {
      await ctx.reply('הפעולה בוטלה. ניתן לשלוח /add כדי להתחיל מחדש.');
      return;
    }

    // Must be a callback query from the keyboard
    if (!categoryCtx.callbackQuery) {
      continue; // silently skip non-command, non-callback updates
    }

    await categoryCtx.answerCallbackQuery();
    const foundCategory = CATEGORIES.find(c => c.id === categoryCtx.callbackQuery!.data);
    if (foundCategory) {
      category = foundCategory;
    } else {
      await ctx.reply('אנא בחר קטגוריה מהרשימה');
    }
  }

  // Step 3: Ask for description (optional)
  await ctx.reply('תיאור קצר (או שלח /skip לדלג):');

  const descCtx = await conversation.wait();
  const descText = descCtx.message?.text;

  // Treat any command (other than /skip) as cancellation intent
  if (descText && descText.startsWith('/') && descText !== '/skip') {
    await ctx.reply('הפעולה בוטלה. ניתן לשלוח /add כדי להתחיל מחדש.');
    return;
  }

  const description = descText && descText !== '/skip' ? descText : category.hebrewName;

  // Save to DB — MUST use conversation.external() to prevent replay double-save
  const result = await conversation.external(async () => {
    const db = DatabaseFactory.getInstance();
    return db.createManualTransaction({
      date: new Date().toISOString().slice(0, 10),
      amount: amount!,
      currency: 'ILS',
      description,
      category: category.hebrewName,
    });
  });

  if (!result.success) {
    await ctx.reply('שגיאה בשמירת ההוצאה. נסה שוב.');
    return;
  }

  await ctx.reply(
    `✅ הוצאה נוספה!\n${formatCurrency(amount!)} | ${category.emoji} ${category.hebrewName} | ${description}`
  );
}
