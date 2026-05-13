import { BotContext } from '../types.js';

export async function helpCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(
    `📋 פקודות זמינות:\n\n` +
      `/start — תפריט ראשי\n` +
      `/add — הוסף הוצאה ידנית\n` +
      `/report — דוח הוצאות חודשי\n` +
      `/budget — תקציב חודשי\n` +
      `/sync — סנכרון עם הבנק\n` +
      `/accounts — רשימת חשבונות מחוברים\n` +
      `/cancel — ביטול פעולה נוכחית\n` +
      `/help — הצגת עזרה זו`
  );
}
