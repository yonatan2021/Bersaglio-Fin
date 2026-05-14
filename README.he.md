# Bersaglio-Fin — מערכת ניהול פיננסים אישיים

[English](./README.md)

[![License](https://img.shields.io/github/license/yonatan2021/Bersaglio-Fin?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Supported-orange?style=flat-square)](https://modelcontextprotocol.io/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

> רכז, נתח, ונהל את הנתונים הפיננסיים שלך — הכל על המחשב שלך בלבד.

Bersaglio-Fin סורק עסקאות מבנקים וחברות כרטיסי אשראי ישראליים, שומר אותן במסד נתונים SQLite מוצפן מקומי, וחושף אותן דרך שלושה ממשקים: שרת MCP (לשימוש Claude), בוט טלגרם (לגישה מהנייד), ולוח בקרה Next.js (לניהול). שום מידע לא נשלח לשרתים חיצוניים.

מבוסס על [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers).

---

## מה עובד עכשיו

| רכיב | סטטוס | תיאור |
|------|--------|-------|
| שרת MCP | ✅ עובד | stdio (Claude Desktop) + HTTP על פורט 3001 |
| בוט טלגרם | ✅ עובד | כל 7 הפקודות ממומשות |
| לוח בקרה | ✅ נבנה | 5 דפים: סקירה, חשבונות, תקציב, עסקאות, הגדרות |
| `fin` CLI | ✅ עובד | הפעלה/עצירה, סנכרון, הגדרות, אבחון |
| שכבת שירותים | ✅ עובד | סורק, מסד נתונים, הצפנה — נבדק היטב |
| סוכן Hermes | 🔜 מתוכנן | סוכן AI אישי, יתחבר דרך MCP |

---

## ארכיטקטורה

שלושה ממשקים, מסד נתונים מוצפן אחד:

```
בנקים ישראליים (הפועלים, לאומי, דיסקונט, מקס, ישראכרט...)
        │ israeli-bank-scrapers
        ▼
   ScraperService  +  EncryptionKeyService  +  DatabaseService
        │
        ├─── שרת MCP (Claude Desktop / Hermes)
        ├─── בוט טלגרם (נייד, קריאה בלבד)
        └─── לוח בקרה (Next.js, ניהול)
```

**כלל גבול:** הבוט הוא לקריאה בלבד — אין פרטי גישה שעוברים דרכו. כל הגדרה (חיבור בנקים, קביעת תקציבים) נמצאת בלוח הבקרה. שרת MCP הוא שכבת הגישה לנתונים לסוכני AI.

---

## דרישות מקדימות

- Node.js 18+
- npm
- Chromium — מותקן אוטומטית על ידי ספריית הסורק (דרך Playwright)

---

## התחלה מהירה

### 1. שיכפול והתקנה

```bash
git clone https://github.com/yonatan2021/Bersaglio-Fin.git
cd Bersaglio-Fin
npm install
npm run build
```

### 2. התקנת ה-CLI הגלובלי `fin`

```bash
npm install -g .
```

אימות: `fin --help`

### 3. יצירת קובץ `.env`

```bash
cp .env.example .env
```

לבוט הטלגרם, מלאו:

```env
BOT_TOKEN=הטוקן_של_הבוט_שלכם
ALLOWED_TELEGRAM_IDS=123456789,987654321
```

קבלו טוקן בוט מ-[@BotFather](https://t.me/BotFather). קבלו את מזהה הטלגרם שלכם מ-[@userinfobot](https://t.me/userinfobot).

### 4. הגדרת פרטי גישה לבנקים

צרו קובץ `credentials.json` (ראו `examples/` לפורמט), ואז:

```bash
fin setup creds -f credentials.json
```

תתבקשו לבחור מפתח הצפנה (לפחות 6 תווים). **מפתח זה לעולם לא נשמר על הדיסק** — תזינו אותו בכל פעם שהאפליקציה עולה.

### 5. הגדרת Claude Desktop (אופציונלי)

```bash
fin setup claude
```

פקודה זו כותבת את רשומת שרת MCP לקובץ הגדרות Claude Desktop באופן אוטומטי.

### 6. אתחול מסד הנתונים

```bash
fin setup db
```

### 7. הפעלת שירותים

```bash
fin start all          # שרת MCP + בוט + לוח בקרה
```

או בנפרד:

```bash
fin start mcp          # שרת MCP (HTTP, פורט 3001)
fin start bot          # בוט טלגרם (ברקע)
fin start dashboard    # לוח בקרה בכתובת localhost:3000
```

---

## עזר `fin` CLI

```bash
fin                        # תפריט אינטראקטיבי בעברית
fin start bot              # הפעלת בוט טלגרם (ברקע, PID ב-~/.fin/pids/)
fin start mcp              # הפעלת שרת MCP (HTTP, פורט 3001)
fin start dashboard        # הפעלת לוח בקרה Next.js (פורט 3000)
fin start all              # הפעלת כל שלושת השירותים
fin stop all               # עצירת כל השירותים
fin restart mcp            # הפעלה מחדש של שירות ספציפי
fin status                 # הצגת כל השירותים: פועל/עצור + זמן פעולה

fin sync                   # סנכרון עסקאות מכל הבנקים המוגדרים

fin setup creds -f <נתיב>  # הוספה/עדכון פרטי גישה לבנקים מקובץ JSON
fin setup claude           # רישום שרת MCP עם Claude Desktop
fin setup db               # אתחול או אימות מסד הנתונים
fin setup test             # בדיקת בריאות מלאה של המערכת

fin diag db                # בדיקת קישוריות מסד נתונים
fin diag mcp               # בדיקת בריאות שרת MCP
fin diag notify            # בדיקת התראות macOS
```

---

## בוט טלגרם

הפעלה: `fin start bot`

| פקודה | מה עושה |
|-------|---------|
| `/start` | תפריט ראשי |
| `/accounts` | רשימת חשבונות בנק מחוברים |
| `/budget` | תקציב חודשי מול הוצאות בפועל |
| `/report` | דוח עסקאות חודשי |
| `/sync` | הפעלת סנכרון בנק |
| `/add` | הוספת הוצאה ידנית |
| `/help` | עזרה |
| `/cancel` | ביטול פעולה נוכחית |

רק מזהי טלגרם הרשומים ב-`ALLOWED_TELEGRAM_IDS` יכולים לתקשר עם הבוט.

---

## לוח בקרה

הפעלה: `fin start dashboard` או `cd nextjs-mcp && npm run dev` ← http://localhost:3000

ללוח הבקרה יש `node_modules` משלו. הריצו `cd nextjs-mcp && npm install` בשימוש ראשון.

| דף | מה עושה |
|----|---------|
| `/` | סקירת הוצאות, קטגוריות מובילות, עסקאות אחרונות, הפעלת סנכרון |
| `/accounts` | חיבור/הסרת בנקים, סנכרון הכל, זמן סנכרון אחרון |
| `/budget` | קביעת מגבלות חודשיות לקטגוריה, צפייה בהתקדמות |
| `/transactions` | רשימת עסקאות מלאה, סינון לפי תאריך, ייצוא CSV |
| `/settings` | נעילת מסד נתונים, מידע MCP של Claude Desktop, מחיקת נתונים |

---

## שרת MCP

לשימוש עם Claude Desktop (מצב stdio):

```bash
npm run start:mcp           # stdio — Claude Desktop בלבד
npm run start:mcp:inspector # פתיחת כלי debug של MCP בדפדפן
```

למצב HTTP (פורט 3001): `fin start mcp`

### כלי MCP

| כלי | מה עושה |
|-----|---------|
| `fetchTransactions` | סריקת בנקים ועדכון מסד הנתונים המקומי |
| `sqlQuery` | SELECT לקריאה בלבד על טבלת `transactions` |
| `listTables` | רשימת כל טבלאות מסד הנתונים |
| `describeTable` | עמודות ואינדקסים של טבלה |
| `getTableSchema` | DDL מלא של טבלה |
| `listScrapers` | רשימת סורקי בנקים מוגדרים |
| `fetch-last-month-transactions` | פרומפט: שליפה וסיכום של החודש האחרון |

---

## פורמט קובץ פרטי גישה

```json
[
  {
    "scraper_type": "hapoalim",
    "friendly_name": "הפועלים שלי",
    "credentials": {
      "userCode": "קוד_המשתמש",
      "password": "הסיסמה"
    }
  },
  {
    "scraper_type": "visaCal",
    "friendly_name": "ויזה כאל",
    "credentials": {
      "username": "שם_משתמש",
      "password": "סיסמה"
    }
  }
]
```

סורקים נתמכים: `hapoalim`, `leumi`, `discount`, `mercantile`, `mizrahi`, `beinleumi`, `massad`, `otsarHahayal`, `visaCal`, `max`, `isracard`, `amex`, `yahav`, `beyhadBishvilha`.

דרישות שדות לכל סורק: [הגדרות israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers/blob/master/src/definitions.ts).

---

## מסד נתונים

מאוחסן ב:
- **macOS:** `~/Library/Application Support/Asher/transactions.db`
- **Linux:** `~/.local/share/Asher/transactions.db`
- **Windows:** `%APPDATA%/Asher/transactions.db`

מוצפן עם SQLCipher (`better-sqlite3-multiple-ciphers`). מפתח ההצפנה נמצא בזיכרון בלבד — מוזן בהפעלה, נמחק כשהתהליך מסתיים.

**PostgreSQL אופציונלי:** הגדירו `DATABASE_URL=postgres://user:pass@localhost:5432/db` ב-`.env` — האפליקציה עוברת backend אוטומטית.

---

## אבטחה

- **מפתח הצפנה בזיכרון בלבד** — לעולם לא נכתב לדיסק, לעולם לא מתועד, לעולם לא נשלח ברשת
- **פרטי גישה חסומים מ-MCP** — טבלת `scraper_credentials` מוחרגת מרשימת ה-allowlist של `sqlQuery`
- **אימות SQL מבוסס AST** — רק `SELECT` על טבלת `transactions` מורשה
- **הרשאות קובץ DB** — `chmod 600` (קריאה/כתיבה לבעלים בלבד)
- **אימות בוט** — `ALLOWED_TELEGRAM_IDS` נבדק לפני כל handler
- **מקומי בלבד** — שום נתון פיננסי לעולם לא עוזב את המחשב שלכם

ראו [doc/SECURITY.md](./doc/SECURITY.md) לדגם האיום המלא.

---

## פיתוח

```bash
npm run build      # קומפילציה של TypeScript
npm run typecheck  # בדיקת טיפוסים ללא בנייה
npm run lint       # בדיקה ותיקון סגנון קוד
npm run format     # עיצוב עם Prettier
npm test           # הרצת כל הבדיקות (Vitest)
npm run test:watch # מצב צפייה
```

מבנה הפרויקט:

```
src/
├── bot/           — בוט טלגרם (Grammy)
├── cli/           — fin CLI (Commander.js)
├── mcp/           — שרת MCP
├── services/      — לוגיקה עסקית משותפת (DB, סורק, הצפנה)
├── utils/         — לוגר, אימות SQL, התראות
├── schemas.ts     — אימות Zod ל-14 סוגי פרטי גישה לבנקים
└── types.ts       — טיפוסי TypeScript משותפים

nextjs-mcp/        — לוח בקרה (Next.js 15, App Router, Tailwind 4)
doc/               — תיעוד ארכיטקטורה, אבטחה, מוסכמות
```

**ESM בלבד** — `"type": "module"`. Imports צריכים סיומות `.js` (גם לקבצי `.ts`).

הוקס pre-commit מריצים lint + format אוטומטית (Husky + lint-staged).

---

## סטק טכנולוגי

| שכבה | טכנולוגיה |
|------|-----------|
| Runtime | Node.js 18+ |
| שפה | TypeScript 5 (strict, ESM) |
| מסד נתונים | SQLite + SQLCipher (`better-sqlite3-multiple-ciphers`) |
| סריקה | [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers) |
| MCP | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| בוט | [grammY](https://grammy.dev/) |
| לוח בקרה | Next.js 15, Tailwind CSS 4, App Router |
| בדיקות | [Vitest](https://vitest.dev/) |
| CLI | Commander.js + Inquirer |

---

## קרדיטים

Bersaglio-Fin הוא פורק של [asher-mcp](https://github.com/shlomiuziel/asher-mcp) מאת [@shlomiuziel](https://github.com/shlomiuziel). הארכיטקטורה והעיצוב המקוריים הגיעו מ-asher-mcp.

מתוחזק על ידי [@yonatan2021](https://github.com/yonatan2021).

---

## רישיון

MIT. ראו [LICENSE](./LICENSE).

---

## הצהרת אחריות

תוכנה זו מסופקת "כפי שהיא", ללא אחריות מכל סוג. אתם האחראים הבלעדיים לאבטחת פרטי הגישה לבנקים ומפתחות ההצפנה שלכם. המפתחים אינם אחראים להפסדים כספיים או אובדן נתונים. תמיד אמתו מידע פיננסי חשוב דרך הערוצים הרשמיים של הבנק. תוכנה זו משתלבת עם סורקי בנקים של צד שלישי שמדיניותם מחוץ לשליטת המפתחים.
