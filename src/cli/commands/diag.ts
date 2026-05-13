import chalk from 'chalk';
import { visualHebrew } from '../../utils/rtl.js';
import { sendNotification } from '../../utils/notify.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';
import { encryptionKeyService } from '../../services/EncryptionKeyService.js';
import { PostgreSQLDatabaseService } from '../../services/PostgreSQLDatabaseService.js';
import inquirer from 'inquirer';
import { readPid, isAlive } from './start.js';

interface NotifyOptions {
  title: string;
  message: string;
  sound: boolean;
}

export async function diagNotify(options: NotifyOptions): Promise<void> {
  try {
    console.log(chalk.blue(visualHebrew('📤 שולח התראת בדיקה...')));
    await sendNotification({
      title: options.title,
      message: options.message,
      sound: options.sound,
      wait: false,
    });
    console.log(chalk.green(visualHebrew('✅ התראה נשלחה בהצלחה')));
  } catch (err) {
    console.error(chalk.red(visualHebrew(`❌ נכשל בשליחת התראה: ${(err as Error).message}`)));
    process.exit(1);
  }
}

export async function diagDb(): Promise<void> {
  try {
    const dbService = DatabaseFactory.getInstance();
    const isPostgres = dbService instanceof PostgreSQLDatabaseService;

    if (!isPostgres && encryptionKeyService.getKey() === null) {
      const { key } = await inquirer.prompt([
        { type: 'password', name: 'key', message: visualHebrew('הכנס מפתח הצפנה:') },
      ]);
      encryptionKeyService.setKey(key);
    }

    await dbService.initialize();
    // listTables() exists in DatabaseService interface: { success, tables?, error? }
    const result = await dbService.listTables();

    if (result.success) {
      console.log(
        chalk.green(
          visualHebrew(`✅ חיבור למסד נתונים תקין — ${result.tables?.length ?? 0} טבלאות`)
        )
      );
    } else {
      console.error(chalk.red(visualHebrew(`❌ בעיה במסד הנתונים: ${result.error}`)));
      process.exit(1);
    }
  } catch (err) {
    console.error(
      chalk.red(visualHebrew(`❌ שגיאה בבדיקת מסד הנתונים: ${(err as Error).message}`))
    );
    process.exit(1);
  }
}

// Note: StdioClientTransport spawns a NEW server process — it cannot connect to the running one.
// PID check is the correct way to verify the running MCP service.
export async function diagMcp(): Promise<void> {
  const pid = readPid('mcp');
  if (!pid || !isAlive(pid)) {
    console.log(chalk.red(visualHebrew('❌ שרת MCP לא פועל')));
    return;
  }
  console.log(chalk.green(visualHebrew(`✅ שרת MCP פועל (PID ${pid})`)));
}
