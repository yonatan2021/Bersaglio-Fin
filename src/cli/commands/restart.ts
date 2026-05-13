import chalk from 'chalk';
import { visualHebrew } from '../../utils/rtl.js';
import { stopService, stopAll } from './stop.js';
import { startService, startAll, ServiceName, SERVICES } from './start.js';

export async function restartService(name: ServiceName): Promise<void> {
  const svc = SERVICES[name];
  console.log(chalk.blue(visualHebrew(`🔄 מפעיל מחדש את ${svc.label}...`)));
  await stopService(name);
  await startService(name);
}

export async function restartAll(): Promise<void> {
  console.log(chalk.blue(visualHebrew('🔄 מפעיל מחדש את כל השירותים...')));
  await stopAll();
  await startAll();
}
