import chalk from 'chalk';
import { statSync, existsSync } from 'fs';
import { SERVICES, ServiceName, readPid, isAlive, pidFile } from './start.js';

export async function showStatus(): Promise<void> {
  console.log(chalk.bold('\nסטטוס שירותים:\n'));

  for (const name of Object.keys(SERVICES) as ServiceName[]) {
    const svc = SERVICES[name];
    const pid = readPid(name);

    // Note: padEnd() counts bytes, not display chars — Hebrew glyphs are multi-byte.
    // Use a fixed label+newline pattern instead of column alignment.
    if (!pid) {
      console.log(`  ${chalk.red('●')} ${svc.label}  ${chalk.gray('לא פועל')}`);
      continue;
    }

    if (!isAlive(pid)) {
      console.log(`  ${chalk.red('●')} ${svc.label}  ${chalk.red('קרס')} (PID ${pid})`);
      continue;
    }

    // Uptime is approximated from PID file mtime — accurate unless the file was touched externally
    let uptime = '';
    const file = pidFile(name);
    if (existsSync(file)) {
      const mtime = statSync(file).mtime;
      const seconds = Math.floor((Date.now() - mtime.getTime()) / 1000);
      const m = Math.floor(seconds / 60);
      const h = Math.floor(m / 60);
      uptime = h > 0 ? `${h}ש ${m % 60}ד` : `${m}ד ${seconds % 60}ש`;
    }

    console.log(
      `  ${chalk.green('●')} ${svc.label}  ${chalk.green('פועל')} (PID ${pid})${uptime ? `  זמן פעולה: ${uptime}` : ''}`
    );
  }

  console.log('');
}
