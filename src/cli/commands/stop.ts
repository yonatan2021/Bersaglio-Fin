import { unlinkSync } from 'fs';
import chalk from 'chalk';
import { pidFile, readPid, isAlive, ServiceName, SERVICES } from './start.js';

export async function stopService(name: ServiceName): Promise<void> {
  const svc = SERVICES[name];
  const pid = readPid(name);

  if (!pid) {
    console.log(chalk.yellow(`⚠️  ${svc.label} לא נמצא קובץ PID`));
    return;
  }

  if (!isAlive(pid)) {
    console.log(chalk.yellow(`⚠️  ${svc.label} לא פועל (PID ${pid})`));
    unlinkSync(pidFile(name));
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    unlinkSync(pidFile(name));
    console.log(chalk.green(`✅ ${svc.label} הופסק (PID ${pid})`));
  } catch (err) {
    console.error(chalk.red(`❌ נכשל בעצירת ${svc.label}: ${(err as Error).message}`));
    process.exit(1);
  }
}

export async function stopAll(): Promise<void> {
  // parallel like startAll — SIGTERM returns immediately so no reason to sequence
  await Promise.all((Object.keys(SERVICES) as ServiceName[]).map(name => stopService(name)));
}
