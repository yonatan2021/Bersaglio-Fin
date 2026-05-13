#!/usr/bin/env node

// Redirect all console output to stderr first
import '../utils/consoleRedirect.js';

import { configureLogger } from '../utils/logger.js';
configureLogger({ enableConsoleOutput: true });

import { program } from 'commander';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const { Separator } = inquirer;
import { startService, startAll, ServiceName, SERVICES } from './commands/start.js';
import { stopService, stopAll } from './commands/stop.js';
import { restartService, restartAll } from './commands/restart.js';
import { showStatus } from './commands/status.js';
import { runSync } from './commands/sync.js';
import { setupCreds, setupClaude, setupDb, setupTest } from './commands/setup.js';
import { diagNotify, diagDb, diagMcp } from './commands/diag.js';
import { ingestCredentials } from './ingestCredentials.js';
import { configureClaudeIntegration } from '../utils/claudeConfig.js';
import { sendNotification } from '../utils/notify.js';
import { visualHebrew } from '../utils/rtl.js';

program.name('fin').description('ממשק ניהול למערכת בֶּרְסַלְיוֹ').version('1.0.0');

// ── start ──────────────────────────────────────────────────────────────────

const startCmd = program.command('start').description('הפעל שירות');

startCmd
  .command('all')
  .description('הפעל את כל השירותים')
  .action(async () => {
    await startAll();
  });

(Object.keys(SERVICES) as ServiceName[]).forEach(name => {
  startCmd
    .command(name)
    .description(`הפעל ${SERVICES[name].label}`)
    .action(async () => {
      await startService(name);
    });
});

// ── stop ───────────────────────────────────────────────────────────────────

const stopCmd = program.command('stop').description('עצור שירות');

stopCmd
  .command('all')
  .description('עצור את כל השירותים')
  .action(async () => {
    await stopAll();
  });

(Object.keys(SERVICES) as ServiceName[]).forEach(name => {
  stopCmd
    .command(name)
    .description(`עצור ${SERVICES[name].label}`)
    .action(async () => {
      await stopService(name);
    });
});

// ── restart ────────────────────────────────────────────────────────────────

const restartCmd = program.command('restart').description('הפעל מחדש שירות');

restartCmd
  .command('all')
  .description('הפעל מחדש את כל השירותים')
  .action(async () => {
    await restartAll();
  });

(Object.keys(SERVICES) as ServiceName[]).forEach(name => {
  restartCmd
    .command(name)
    .description(`הפעל מחדש ${SERVICES[name].label}`)
    .action(async () => {
      await restartService(name);
    });
});

// ── status ─────────────────────────────────────────────────────────────────

program
  .command('status')
  .description('הצג סטטוס כל השירותים')
  .action(async () => {
    await showStatus();
  });

// ── sync ───────────────────────────────────────────────────────────────────

// Note: ScraperService.fetchAllTransactions() has no bank filter — --bank omitted until supported
program
  .command('sync')
  .description('סנכרן עסקאות מהבנקים')
  .action(async () => {
    await runSync();
  });

// ── setup ──────────────────────────────────────────────────────────────────

const setupCmd = program.command('setup').description('הגדרות ראשוניות');

setupCmd
  .command('creds')
  .description('ייבא פרטי גישה לבנקים')
  .requiredOption('-f, --file <path>', 'נתיב לקובץ JSON עם פרטי הגישה')
  .option('-k, --key <key>', 'מפתח הצפנה (אופציונלי)')
  .action(async (opts: { file: string; key?: string }) => {
    await setupCreds(opts.file, opts.key);
  });

setupCmd
  .command('claude')
  .description('הגדר אינטגרציה עם Claude Desktop')
  .action(async () => {
    await setupClaude();
  });

setupCmd
  .command('db')
  .description('אתחל מסד נתונים')
  .action(async () => {
    await setupDb();
  });

setupCmd
  .command('test')
  .description('בדוק את כל רכיבי המערכת')
  .action(async () => {
    await setupTest();
  });

// ── diag ───────────────────────────────────────────────────────────────────

const diagCmd = program.command('diag').description('אבחון המערכת');

diagCmd
  .command('notify')
  .description('שלח התראת בדיקה')
  .option('-t, --title <title>', 'כותרת ההתראה', 'Bersaglio — בדיקה')
  .option('-m, --message <message>', 'תוכן ההתראה', 'זוהי התראת בדיקה')
  .option('--sound', 'הפעל צליל', false)
  .action(async (opts: { title: string; message: string; sound: boolean }) => {
    await diagNotify(opts);
  });

diagCmd
  .command('db')
  .description('בדוק חיבור למסד נתונים')
  .action(async () => {
    await diagDb();
  });

diagCmd
  .command('mcp')
  .description('בדוק שרת MCP')
  .action(async () => {
    await diagMcp();
  });

// ── hidden backward-compat aliases ─────────────────────────────────────────

// Note: old ingest-creds ran scraping automatically after credential save.
// That step is intentionally removed — use 'fin sync' separately.
program
  .command('ingest-creds', { hidden: true })
  .requiredOption('-f, --file <path>', 'Path to the credentials JSON file')
  .option('-k, --key <key>', 'Encryption key')
  .action(async (opts: { file: string; key?: string }) => {
    await ingestCredentials(opts.file, opts.key);
    process.exit(0);
  });

// src/cli/index.ts → up 2 levels = project root; fileURLToPath decodes Hebrew dir chars
const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

program.command('configure:claude', { hidden: true }).action(async () => {
  const result = await configureClaudeIntegration(PROJECT_ROOT);
  console.log(result.message);
  process.exit(0);
});

program
  .command('diagnostics:notify', { hidden: true })
  .option('-t, --title <title>', 'Notification title', 'Test Notification')
  .option('-m, --message <message>', 'Notification message', 'This is a test notification')
  .option('--sound', 'Enable sound', false)
  .action(async (opts: { title: string; message: string; sound: boolean }) => {
    await sendNotification({
      title: opts.title,
      message: opts.message,
      sound: opts.sound,
      wait: false,
    });
    process.exit(0);
  });

// ── interactive menu (no args) ─────────────────────────────────────────────
// When called with no arguments, show a navigable Hebrew menu instead of --help

if (process.argv.length === 2) {
  (async () => {
    console.log('\n🎯 Bersaglio\n');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: visualHebrew('מה תרצה לעשות?'),
        choices: [
          { name: visualHebrew('🚀 הפעל שירות'), value: 'start' },
          { name: visualHebrew('⏹️  עצור שירות'), value: 'stop' },
          { name: visualHebrew('🔄 הפעל מחדש שירות'), value: 'restart' },
          { name: visualHebrew('📊 הצג סטטוס'), value: 'status' },
          { name: visualHebrew('💳 סנכרן עסקאות'), value: 'sync' },
          { name: visualHebrew('⚙️  הגדרות'), value: 'setup' },
          { name: visualHebrew('🔍 אבחון'), value: 'diag' },
          new Separator(), // v9 ESM: import { Separator } from 'inquirer'
          { name: visualHebrew('❌ יציאה'), value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') process.exit(0);

    if (action === 'status') {
      await showStatus();
      return;
    }

    if (action === 'sync') {
      await runSync(); // no bank filter — fetchAllTransactions() takes no params
      return;
    }

    if (['start', 'stop', 'restart'].includes(action)) {
      const { service } = await inquirer.prompt([
        {
          type: 'list',
          name: 'service',
          message: visualHebrew('איזה שירות?'),
          choices: [
            ...Object.entries(SERVICES).map(([key, svc]) => ({
              name: visualHebrew(svc.label),
              value: key,
            })),
            { name: visualHebrew('כל השירותים'), value: 'all' },
          ],
        },
      ]);

      if (action === 'start') {
        if (service === 'all') {
          await startAll();
        } else {
          await startService(service as ServiceName);
        }
      } else if (action === 'stop') {
        if (service === 'all') {
          await stopAll();
        } else {
          await stopService(service as ServiceName);
        }
      } else {
        if (service === 'all') {
          await restartAll();
        } else {
          await restartService(service as ServiceName);
        }
      }
      return;
    }

    if (action === 'setup') {
      const { sub } = await inquirer.prompt([
        {
          type: 'list',
          name: 'sub',
          message: visualHebrew('הגדרות:'),
          choices: [
            { name: visualHebrew('ייבא פרטי גישה לבנקים'), value: 'creds' },
            { name: visualHebrew('הגדר Claude Desktop'), value: 'claude' },
            { name: visualHebrew('אתחל מסד נתונים'), value: 'db' },
            { name: visualHebrew('בדוק את כל הרכיבים'), value: 'test' },
          ],
        },
      ]);

      if (sub === 'creds') {
        const { file } = await inquirer.prompt([
          { type: 'input', name: 'file', message: visualHebrew('נתיב לקובץ JSON:') },
        ]);
        await setupCreds(file);
      } else if (sub === 'claude') {
        await setupClaude();
      } else if (sub === 'db') {
        await setupDb();
      } else {
        await setupTest();
      }
      return;
    }

    if (action === 'diag') {
      const { sub } = await inquirer.prompt([
        {
          type: 'list',
          name: 'sub',
          message: visualHebrew('אבחון:'),
          choices: [
            { name: visualHebrew('בדוק התראות'), value: 'notify' },
            { name: visualHebrew('בדוק מסד נתונים'), value: 'db' },
            { name: visualHebrew('בדוק שרת MCP'), value: 'mcp' },
          ],
        },
      ]);

      if (sub === 'notify') {
        await diagNotify({ title: 'Bersaglio — בדיקה', message: 'זוהי התראת בדיקה', sound: false });
      } else if (sub === 'db') {
        await diagDb();
      } else {
        await diagMcp();
      }
      return;
    }
  })();
} else {
  program.parse(process.argv);
}
