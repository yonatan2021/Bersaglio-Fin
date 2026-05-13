import chalk from 'chalk';
import inquirer from 'inquirer';
import { visualHebrew } from '../../utils/rtl.js';
import { fileURLToPath } from 'url';
import { ingestCredentials } from '../ingestCredentials.js';
import { configureClaudeIntegration } from '../../utils/claudeConfig.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';
import { encryptionKeyService } from '../../services/EncryptionKeyService.js';
import { PostgreSQLDatabaseService } from '../../services/PostgreSQLDatabaseService.js';
import { readPid, isAlive } from './start.js'; // static import — no circular dependency

// fileURLToPath decodes percent-encoded chars (important for paths with non-ASCII like Hebrew dirs)
const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url));

export async function setupCreds(filePath: string, key?: string): Promise<void> {
  try {
    await ingestCredentials(filePath, key);

    const dbService = DatabaseFactory.getInstance();
    const isPostgres = dbService instanceof PostgreSQLDatabaseService;

    if (!isPostgres) {
      const { testNotify } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'testNotify',
          message: visualHebrew('האם לבדוק התראות מערכת?'),
          default: true,
        },
      ]);

      if (testNotify) {
        const { sendNotification } = await import('../../utils/notify.js');
        try {
          await sendNotification({
            title: 'Bersaglio — בדיקת התראה',
            message: 'הגדרת המערכת הושלמה.',
            sound: true,
            wait: false,
            timeout: 15,
          });
          console.log(chalk.green(visualHebrew('✅ התראה נשלחה בהצלחה')));
        } catch {
          console.warn(chalk.yellow(visualHebrew('⚠️  לא ניתן לשלוח התראה — בדוק הרשאות מערכת')));
        }
      }
    }

    console.log(chalk.green(visualHebrew('✅ פרטי הגישה נשמרו בהצלחה')));
    process.exit(0);
  } catch (err) {
    console.error(chalk.red(visualHebrew(`❌ שגיאה בהגדרת פרטי גישה: ${(err as Error).message}`)));
    process.exit(1);
  }
}

export async function setupClaude(): Promise<void> {
  try {
    console.log(chalk.blue(visualHebrew('⚙️  מגדיר אינטגרציה עם Claude Desktop...')));
    const result = await configureClaudeIntegration(PROJECT_ROOT); // use PROJECT_ROOT, not process.cwd()
    console.log(result.message);
    process.exit(0);
  } catch (err) {
    console.error(chalk.red(visualHebrew(`❌ שגיאה בהגדרת Claude: ${(err as Error).message}`)));
    process.exit(1);
  }
}

export async function setupDb(): Promise<void> {
  try {
    const dbService = DatabaseFactory.getInstance();
    const isPostgres = dbService instanceof PostgreSQLDatabaseService;

    if (!isPostgres && encryptionKeyService.getKey() === null) {
      const { key } = await inquirer.prompt([
        {
          type: 'password',
          name: 'key',
          message: visualHebrew('הכנס מפתח הצפנה:'),
          validate: (v: string) => v.length >= 6 || visualHebrew('מפתח חייב להיות לפחות 6 תווים'),
        },
      ]);
      encryptionKeyService.setKey(key);
    }

    await dbService.initialize();
    console.log(chalk.green(visualHebrew('✅ מסד הנתונים מוכן')));
    process.exit(0);
  } catch (err) {
    console.error(
      chalk.red(visualHebrew(`❌ שגיאה באתחול מסד הנתונים: ${(err as Error).message}`))
    );
    process.exit(1);
  }
}

export async function setupTest(): Promise<void> {
  console.log(chalk.bold(visualHebrew('\n🔍 בדיקת מערכת מלאה:\n')));
  let allOk = true;

  // DB check
  try {
    const dbService = DatabaseFactory.getInstance();
    const isPostgres = dbService instanceof PostgreSQLDatabaseService;
    if (!isPostgres && encryptionKeyService.getKey() === null) {
      const { key } = await inquirer.prompt([
        { type: 'password', name: 'key', message: visualHebrew('הכנס מפתח הצפנה לבדיקה:') },
      ]);
      encryptionKeyService.setKey(key);
    }
    await dbService.initialize();
    const result = await dbService.listTables();
    if (result.success) {
      console.log(
        chalk.green(visualHebrew(`  ✅ מסד נתונים — תקין (${result.tables?.length ?? 0} טבלאות)`))
      );
    } else {
      console.log(chalk.red(visualHebrew(`  ❌ מסד נתונים — שגיאה: ${result.error}`)));
      allOk = false;
    }
  } catch (err) {
    console.log(chalk.red(visualHebrew(`  ❌ מסד נתונים — שגיאה: ${(err as Error).message}`)));
    allOk = false;
  }

  // MCP check (PID only) — readPid/isAlive already statically imported at top of file
  const mcpPid = readPid('mcp');
  if (mcpPid && isAlive(mcpPid)) {
    console.log(chalk.green(visualHebrew(`  ✅ שרת MCP — פועל (PID ${mcpPid})`)));
  } else {
    console.log(chalk.yellow(visualHebrew(`  ⚠️  שרת MCP — לא פועל`)));
  }

  // Bot check (PID only)
  const botPid = readPid('bot');
  if (botPid && isAlive(botPid)) {
    console.log(chalk.green(visualHebrew(`  ✅ בוט טלגרם — פועל (PID ${botPid})`)));
  } else {
    console.log(chalk.yellow(visualHebrew(`  ⚠️  בוט טלגרם — לא פועל`)));
  }

  console.log('');
  if (allOk) {
    console.log(chalk.green(visualHebrew('✅ כל הבדיקות עברו')));
  } else {
    console.log(chalk.red(visualHebrew('❌ חלק מהבדיקות נכשלו')));
    process.exit(1);
  }
}
