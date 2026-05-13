import chalk from 'chalk';
import { stopService, stopAll } from './stop.js';
import { startService, startAll, ServiceName, SERVICES } from './start.js';

export async function restartService(name: ServiceName): Promise<void> {
  const svc = SERVICES[name];
  console.log(chalk.blue(`🔄 מפעיל מחדש את ${svc.label}...`));
  await stopService(name);
  await startService(name);
}

export async function restartAll(): Promise<void> {
  console.log(chalk.blue('🔄 מפעיל מחדש את כל השירותים...'));
  await stopAll();
  await startAll();
}
