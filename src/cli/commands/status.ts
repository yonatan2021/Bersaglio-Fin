import chalk from 'chalk';
import { statSync, existsSync } from 'fs';
import { SERVICES, ServiceName, readPid, isAlive, pidFile } from './start.js';
import { visualHebrew } from '../../utils/rtl.js';

export async function showStatus(): Promise<void> {
  console.log(chalk.bold(visualHebrew('\nסטטוס שירותים:\n')));

  for (const name of Object.keys(SERVICES) as ServiceName[]) {
    const svc = SERVICES[name];
    const pid = readPid(name);

    if (!pid) {
      console.log(
        `  ${chalk.red('●')} ${visualHebrew(svc.label)}  ${chalk.gray(visualHebrew('לא פועל'))}`
      );
      continue;
    }

    if (!isAlive(pid)) {
      console.log(
        `  ${chalk.red('●')} ${visualHebrew(svc.label)}  ${chalk.red(visualHebrew('קרס'))} (PID ${pid})`
      );
      continue;
    }

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
      `  ${chalk.green('●')} ${visualHebrew(svc.label)}  ${chalk.green(visualHebrew('פועל'))} (PID ${pid})${uptime ? `  ${visualHebrew(`זמן פעולה: ${uptime}`)}` : ''}`
    );
  }

  console.log('');
}
