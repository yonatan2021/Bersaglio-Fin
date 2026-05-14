import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const FIN_DIR = join(homedir(), '.fin');
export const HERMES_CONFIG_PATH = join(FIN_DIR, 'hermes-mcp.json');
export const MCP_HTTP_PORT = 3001;
export const MCP_HTTP_URL = `http://localhost:${MCP_HTTP_PORT}`;

export const MCP_TOOLS = [
  {
    name: 'fetchTransactions',
    description: 'Fetch transactions from all configured bank scrapers and save to DB',
  },
  { name: 'listTables', description: 'List all tables in the financial database' },
  { name: 'describeTable', description: 'Get columns and indexes for a specific table' },
  { name: 'getTableSchema', description: 'Get full DDL for a table' },
  {
    name: 'sqlQuery',
    description: 'Execute a safe read-only SELECT query on allowed tables (transactions only)',
  },
  { name: 'listScrapers', description: 'List all available bank scrapers' },
];

export interface HermesMcpConfig {
  server: {
    name: string;
    url: string;
    transport: string;
    description: string;
  };
  tools: Array<{ name: string; description: string }>;
  generatedAt: string;
}

export async function writeHermesConfig(): Promise<{ path: string; config: HermesMcpConfig }> {
  await mkdir(FIN_DIR, { recursive: true });

  const config: HermesMcpConfig = {
    server: {
      name: 'bersaglio-financial',
      url: MCP_HTTP_URL,
      transport: 'streamable-http',
      description: 'Bersaglio financial data MCP server. Start with: fin start mcp',
    },
    tools: MCP_TOOLS,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(HERMES_CONFIG_PATH, JSON.stringify(config, null, 2));
  return { path: HERMES_CONFIG_PATH, config };
}

export async function readHermesConfig(): Promise<HermesMcpConfig | null> {
  try {
    const raw = await readFile(HERMES_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as HermesMcpConfig;
  } catch {
    return null;
  }
}

export async function checkMcpHttpAlive(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    try {
      await fetch(MCP_HTTP_URL, { method: 'GET', signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
    return true;
  } catch {
    // ECONNREFUSED = server not running; AbortError = timeout
    return false;
  }
}
