import { spawn } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

export const PID_DIR = join(homedir(), '.fin', 'pids');

// Derive project root from this file's location (src/cli/commands/start.ts → ../../..)
// fileURLToPath decodes percent-encoded chars (important for paths with non-ASCII like Hebrew dirs)
const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url));

// Use local tsx from node_modules/.bin rather than requiring a global install
const TSX = join(PROJECT_ROOT, 'node_modules/.bin/tsx');

export const SERVICES = {
  bot: {
    label: 'בוט טלגרם',
    cmd: TSX,
    args: [join(PROJECT_ROOT, 'src/bot/index.ts')],
    cwd: PROJECT_ROOT,
  },
  mcp: {
    label: 'שרת MCP',
    cmd: TSX,
    args: [join(PROJECT_ROOT, 'src/mcp/Server.ts')],
    cwd: PROJECT_ROOT,
  },
  dashboard: {
    label: 'דשבורד',
    cmd: 'npm',
    args: ['run', 'dev'],
    cwd: join(PROJECT_ROOT, 'nextjs-mcp'),
  },
} as const;

export type ServiceName = keyof typeof SERVICES;

export function pidFile(name: ServiceName): string {
  return join(PID_DIR, `${name}.pid`);
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function readPid(name: ServiceName): number | null {
  const file = pidFile(name);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, 'utf-8').trim();
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export async function startService(name: ServiceName): Promise<void> {
  const svc = SERVICES[name];

  const existingPid = readPid(name);
  if (existingPid && isAlive(existingPid)) {
    console.log(chalk.yellow(`⚠️  ${svc.label} כבר רץ (PID ${existingPid})`));
    return;
  }

  mkdirSync(PID_DIR, { recursive: true });

  const child = spawn(svc.cmd, [...svc.args], {
    cwd: svc.cwd,
    detached: true,
    stdio: 'ignore', // ignore so the process survives terminal close (inherit = SIGHUP on terminal exit)
    env: name === 'mcp' ? { ...process.env, MCP_HTTP_PORT: '3001' } : undefined,
  });

  if (!child.pid) {
    console.error(chalk.red(`❌ נכשל בהפעלת ${svc.label}`));
    process.exit(1);
  }

  writeFileSync(pidFile(name), String(child.pid));
  child.unref();

  console.log(chalk.green(`✅ ${svc.label} הופעל (PID ${child.pid})`));
}

export async function startAll(): Promise<void> {
  console.log(chalk.blue('🚀 מפעיל את כל השירותים...'));
  // spawn returns immediately — no need to await sequentially
  await Promise.all((Object.keys(SERVICES) as ServiceName[]).map(name => startService(name)));
}
