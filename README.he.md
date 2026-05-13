# 🇮🇱 Bersaglio-Fin - שרת MCP לנתונים פיננסיים אישיים

[English](./README.md)

[![License](https://img.shields.io/github/license/yonatan2021/Bersaglio-Fin?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Supported-orange?style=flat-square)](https://modelcontextprotocol.io/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

> **התקרבו לנתונים שלכם, על סטרואידים!**

Bersaglio-Fin הוא צבר (Aggregator) נתונים פיננסיים מאובטח, הפועל במודל "Local-first" עבור בנקים וחברות כרטיסי אשראי ישראליים. המערכת בנויה ב-TypeScript ומבוססת על [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers). Bersaglio-Fin עוזר לכם לרכז ולנתח את העסקאות הפיננסיות שלכם ממספר מקורות, תוך שמירה על פרטיות ואבטחת הנתונים שלכם.

![demo](./.github/demo.gif)

---

## ✨ מה חדש בפורק (Fork) הזה?

- **מיתוג מחדש**: הגירה מלאה מ-`asher-mcp` ל-`Bersaglio-Fin`.
- **תחזוקה**: מתוחזק כעת על ידי [@yonatan2021](https://github.com/yonatan2021).
- **תיעוד מאוחד**: עקרונות הארכיטקטורה והאבטחה הליבתיים שולבו בתוך ה-README הראשי.
- **יכולות בוט משופרות**: בוט טלגרם מלא לגישה מהנייד ודיווח עסקאות.

## 🚀 תכונות עיקריות

- **🤖 שרת MCP**: מימוש פרוטוקול Model Context Protocol לשילוב קל עם מארחי MCP (כמו Claude).
- **🇮🇱 אינטגרציה רחבה**: תמיכה בכל הבנקים וחברות האשראי בישראל הנתמכים על ידי [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers).
- **🏠 Local-First**: הנתונים הפיננסיים שלכם לעולם לא עוזבים את המחשב שלכם.
- **🔒 הצפנה**: נתונים רגישים מוצפנים במצב מנוחה (At rest) באמצעות SQLCipher (`better-sqlite3-multiple-ciphers`).
- **📱 בוט טלגרם**: צפייה בחשבונות, תקציבים ודוחות חודשיים מכל מקום באמצעות בוט מאובטח.
- **💻 CLI**: הגדרה וניהול קלים דרך שורת הפקודה.
- **TypeScript**: בנוי עם הקפדה על טיפוסיות (Type safety) ו-Native ESM.

## 🛠 טכנולוגיות (Tech Stack)

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **שפה**: [TypeScript](https://www.typescriptlang.org/)
- **מסד נתונים**: [SQLite](https://www.sqlite.org/) עם [SQLCipher](https://www.zetetic.net/sqlcipher/)
- **סריקה**: [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers)
- **בוט**: [grammY](https://grammy.dev/)
- **בדיקות**: [Vitest](https://vitest.dev/)

## 🏗 ארכיטקטורת מערכת

Bersaglio-Fin עוקב אחרי ארכיטקטורת "Local-first" עם שלושה ממשקי צריכה המשתפים שכבת נתונים מאוחדת:

- **שכבת הליבה (`src/services/`)**: מכילה לוגיקה עסקית משותפת הכוללת את ה-`ScraperService` לסריקת בנקים, `EncryptionKeyService` לניהול מפתח הצפנה בזיכרון, ו-`DatabaseService` לאחסון SQLite מוצפן.
- **שרת MCP (`src/mcp/`)**: שכבת הגישה העיקרית לנתונים עבור סוכני AI כמו Claude Desktop או Hermes.
- **בוט טלגרם (`src/bot/`)**: ממשק לקריאה בלבד לגישה מהנייד, המספק סטטוס תקציב ודוחות עסקאות.
- **לוח בקרה (`nextjs-mcp/`)**: ממשק ניהול ב-Next.js להגדרות מלאות וניתוחים מפורטים.

## דרישות קדם

- Node.js 18+
- npm

## התקנה

1. שכפלו את המאגר (Repository):
   ```bash
   git clone https://github.com/yonatan2021/Bersaglio-Fin.git
   cd Bersaglio-Fin
   ```

2. התקינו תלויות (Dependencies):
   ```bash
   npm install
   ```

3. בנו את הפרויקט:
   ```bash
   npm run build
   ```

4. **אופציונלי**: התקינו את פקודת ה-CLI המערכתית `fin`:
   ```bash
   npm install -g .
   ```

5. התקינו את `tsx` (TypeScript Execute) גלובלית (נדרש עבור אינטגרציה עם Claude Desktop):
   ```bash
   npm install -g tsx
   ```

## מיקום מסד הנתונים

קובץ מסד הנתונים נשמר במיקומים הבאים, בהתאם למערכת ההפעלה שלכם:

- **macOS:** `~/Library/Application Support/Bersaglio-Fin/database.db`
- **Linux:** `~/.local/share/Bersaglio-Fin/database.db`
- **Windows:** `%APPDATA%/Bersaglio-Fin/database.db`

## הרצה ראשונית והגדרות

1. הכינו קובץ `credentials.json` עם פרטי הגישה שלכם לספקים הפיננסיים.
   ניתן לראות את הספקים הנתמכים ואת שדות פרטי הגישה [כאן](https://github.com/eshaham/israeli-bank-scrapers/blob/master/src/definitions.ts).

2. הזינו את פרטי הגישה שלכם:
   ```bash
   fin setup creds -f credentials.json
   ```
   - תתבקשו להזין מפתח הצפנה (לפחות 6 תווים).
   - מפתח זה **לעולם לא נשמר על הדיסק** ויש לספק אותו בכל פעם שהאפליקציה עולה.

3. במהלך ההגדרה, תוכלו:
   - להפעיל התראות עבור סטטוס הסנכרון.
   - לבצע סריקה ראשונית של כל החשבונות.
   - להגדיר אינטגרציה עם Claude Desktop באופן אוטומטי.

## שימוש

### כלי MCP

Bersaglio-Fin מספק מספר כלים עבור מארחי MCP (Claude, Hermes ועוד):

- `fetchTransactions`: הפעלת סריקת בנקים ועדכון מסד הנתונים המקומי.
- `sqlQuery`: הרצת שאילתות SELECT מאובטחות לקריאה בלבד על טבלת העסקאות.
- `listTables` / `describeTable`: חקירת סכימת מסד הנתונים.
- `fetch-last-month-transactions`: קבלת תצוגה מסוכמת של ההוצאות מהחודש האחרון.

### בוט טלגרם

הגדירו את ה-`BOT_TOKEN` ואת ה-`ALLOWED_TELEGRAM_IDS` שלכם בקובץ `.env`, ולאחר מכן הריצו:
```bash
npm run start:bot
```
פקודות זמינות: `/report`, `/budget`, `/accounts`, `/sync`.

## אבטחה ופרטיות

- **אחסון מקומי בגישת Zero-Trust**: כל הנתונים הפיננסיים מוצפנים במצב מנוחה באמצעות SQLCipher.
- **מפתח בזיכרון בלבד**: מפתח ההצפנה נשמר בזיכרון בלבד ונמחק עם סיום פעולת התוכנית. הוא לעולם לא נרשם בלוגים או נשלח ברשת.
- **אימות SQL**: וולידטור מבוסס AST מבטיח שרק שאילתות SELECT בטוחות יורצו, תוך החרגה קשיחה של טבלת פרטי הגישה (credentials) ומתן גישה לטבלת ה-`transactions` בלבד.
- **מקומי בלבד**: שום מידע פיננסי או פרטי גישה לא עוזבים את המחשב שלכם. לא נעשה שימוש ב-LLM חיצוני (כמו OpenAI או OpenRouter) לעיבוד נתונים רגישים.

## מוסכמות פיתוח

- **Native ESM**: הפרויקט משתמש ב-`"type": "module"`. כל ה-Imports חייבים לכלול את סיומת ה-`.js`.
- **שירותי Singleton**: כל שירותי הליבה (Database, Scraper, Encryption) משתמשים בתבנית Singleton.
- **תבנית Factory**: ה-`DatabaseFactory` מנהל את בחירת ה-Backend (SQLite כברירת מחדל, PostgreSQL כאופציה).
- **טיפוסיות קשיחה**: ללא שימוש ב-`any`. מצב Strict TypeScript מופעל.

## קרדיטים

### ייחוס (Attribution)
Bersaglio-Fin הוא פורק (Fork) של [asher-mcp](https://github.com/shlomiuziel/asher-mcp) מאת [@shlomiuziel](https://github.com/shlomiuziel).
כל הארכיטקטורה והעיצוב המקוריים הגיעו מ-asher-mcp.

## רישיון

פרויקט זה מופץ תחת רישיון MIT. ראו את קובץ ה-[LICENSE](LICENSE) לפרטים נוספים.

## ⚠️ הצהרת פטור מאחריות חשובה

**אנא קראו הצהרה זו בעיון לפני השימוש בתוכנה.**

תוכנה זו נועדה לעזור לכם לנתח את הנתונים הפיננסיים שלכם ולהנגיש אותם למארחי MCP. עם זאת, בשימוש בתוכנה זו, אתם מאשרים ומסכימים לאמור להלן:

1. **העדר אחריות**: תוכנה זו מסופקת "כפי שהיא" (As is), ללא אחריות מכל סוג שהוא, מפורשת או משתמעת.
2. **אבטחת נתונים פיננסיים**: אתם האחראים הבלעדיים לאבטחת פרטי הגישה לבנקים ומפתחות ההצפנה שלכם.
3. **השימוש על אחריותכם בלבד**: המפתחים אינם אחראים לכל הפסד כספי או אובדן נתונים. תמיד אמת את המידע הפיננסי החשוב דרך הערוצים הרשמיים של הבנק.
4. **העדר חבות**: בשום מקרה המחברים לא יהיו אחראים לכל תביעה או נזק.
5. **שירותי צד שלישי**: תוכנה זו משתלבת עם סורקי בנקים של צד שלישי. המפתחים אינם אחראים למדיניות שלהם.

בשימוש בתוכנה זו, אתם מאשרים שקראתם הצהרה זו ואתם מסכימים לתנאיה.
