import chalk from 'chalk';
import { encryptionKeyService } from '../../services/EncryptionKeyService.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';
import { PostgreSQLDatabaseService } from '../../services/PostgreSQLDatabaseService.js';
import inquirer from 'inquirer';

// Note: ScraperService.fetchAllTransactions() takes no params — no per-bank filter yet.
// --bank option is omitted until the service supports it.
export async function runSync(): Promise<void> {
  try {
    const dbService = DatabaseFactory.getInstance();
    const isPostgres = dbService instanceof PostgreSQLDatabaseService;

    if (!isPostgres && encryptionKeyService.getKey() === null) {
      const { key } = await inquirer.prompt([
        {
          type: 'password',
          name: 'key',
          message: 'הכנס מפתח הצפנה:',
        },
      ]);
      encryptionKeyService.setKey(key);
    }

    await dbService.initialize();

    const { scraperService } = await import('../../services/ScraperService.js');
    console.log(chalk.blue('🔄 מסנכרן את כל החשבונות...'));

    const result = await scraperService.fetchAllTransactions();

    if (!result.success) {
      console.error(chalk.red('❌ שגיאה בסינכרון'));
      result.results.forEach((r: { success: boolean; friendlyName: string; error?: string }) => {
        if (!r.success) console.error(chalk.red(`  ❌ ${r.friendlyName}: ${r.error}`));
      });
      process.exit(1);
    }

    const successCount = result.results.filter((r: { success: boolean }) => r.success).length;
    console.log(chalk.green(`✅ סינכרון הושלם: ${successCount}/${result.results.length} חשבונות`));

    result.results.forEach(
      (r: {
        success: boolean;
        friendlyName: string;
        accounts?: Array<{ txns?: unknown[] }>;
        error?: string;
      }) => {
        const count = r.accounts?.reduce((s, acc) => s + (acc.txns?.length || 0), 0) || 0;
        const icon = r.success ? '✅' : '❌';
        const detail = r.success ? `${count} עסקאות` : r.error;
        console.log(`  ${icon} ${r.friendlyName}: ${detail}`);
      }
    );
  } catch (err) {
    console.error(chalk.red(`❌ שגיאה בסינכרון: ${(err as Error).message}`));
    process.exit(1);
  }
}
