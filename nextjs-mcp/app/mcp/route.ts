import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getDbInstance } from '@main-src/services/DatabaseService';
import { encryptionKeyService } from '@main-src/services/EncryptionKeyService';

interface TextContent {
  type: 'text';
  text: string;
  [key: string]: unknown;
}

type ZodRecord<T extends z.ZodTypeAny = z.ZodTypeAny> = Record<string, z.infer<T>>;

interface ToolSchema {
  description?: string;
  inputSchema?: Record<string, ZodRecord>;
}

type ToolHandler = (params: Record<string, unknown>) => Promise<unknown>;

function textResponse(text: string): { content: TextContent[] } {
  return {
    content: [{ type: 'text', text }],
  };
}

async function getMcpDb() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && !encryptionKeyService.getKey()) {
    console.log('[MCP] Using ENCRYPTION_KEY from env (singleton key was empty after restart/hot-reload)');
    encryptionKeyService.setKey(envKey);
  }
  if (!encryptionKeyService.getKey()) {
    throw new Error(
      'No encryption key available. Set ENCRYPTION_KEY env var in .env.local, or unlock the dashboard first.'
    );
  }
  const db = getDbInstance();
  await db.initialize();
  return db;
}

const SAFE_TABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const tools: Record<string, { handler: ToolHandler; schema?: ToolSchema }> = {
  listTables: {
    handler: async () => {
      const db = await getMcpDb();
      const result = await db.listTables();
      if (!result.success) {
        throw new Error(result.error || 'Failed to list tables');
      }
      return { success: true, data: { tables: result.tables } };
    },
    schema: {
      description: 'List all tables in the database',
    },
  },

  getTableSchema: {
    handler: async (params: Record<string, unknown>) => {
      const { table } = params as { table: string };
      if (!table || !SAFE_TABLE_NAME.test(table)) {
        throw new Error('Invalid table name');
      }
      const db = await getMcpDb();
      const columns = await db.query(`PRAGMA table_info(${table})`);
      return { success: true, data: { schema: columns } };
    },
    schema: {
      description: 'Get the schema for a specific table',
      inputSchema: {
        table: z.string().describe('Name of the table to get schema for'),
      },
    },
  },

  sqlQuery: {
    handler: async (params: Record<string, unknown>) => {
      const { query } = params as { query: string };
      if (!query) {
        throw new Error('Query is required');
      }

      const db = await getMcpDb();
      const result = await db.executeSafeSelectQuery(query);
      if (!result.success) {
        throw new Error(result.error || 'Query execution failed');
      }
      return { success: true, data: result.data };
    },
    schema: {
      description: 'Execute a safe SELECT query on allowed tables',
      inputSchema: {
        query: z.string().describe('SQL SELECT query to execute'),
      },
    },
  },

  describeTable: {
    handler: async (params: Record<string, unknown>) => {
      const { table } = params as { table: string };
      if (!table || !SAFE_TABLE_NAME.test(table)) {
        throw new Error('Invalid table name');
      }
      const db = await getMcpDb();
      const columns = await db.query(`PRAGMA table_info(${table})`);
      const indexList = await db.query<{ name: string; unique: number; origin: string; partial: number }>(
        `PRAGMA index_list(${table})`
      );
      const indexes = [] as Array<{ name: string; unique: number; origin: string; columns: unknown[] }>;
      for (const idx of indexList) {
        if (!SAFE_TABLE_NAME.test(idx.name)) continue;
        const info = await db.query(`PRAGMA index_info(${idx.name})`);
        indexes.push({ name: idx.name, unique: idx.unique, origin: idx.origin, columns: info });
      }

      return {
        success: true,
        data: {
          columns,
          indexes,
        },
      };
    },
    schema: {
      description: 'Get detailed information about a table including columns and indexes',
      inputSchema: {
        table: z.string().describe('Name of the table to describe'),
      },
    },
  },

  getCurrentDate: {
    handler: async () => {
      const now = new Date();
      return {
        success: true,
        data: {
          date: now.toISOString().split('T')[0], // YYYY-MM-DD
          datetime: now.toISOString(),
          timestamp: now.getTime(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
    },
    schema: {
      description: 'Get the current date and time. Use this to understand what "today", "this month", "this year" means in user queries.',
      inputSchema: {},
    },
  },
};

const mcpHandler = createMcpHandler(
  (server) => {
    Object.entries(tools).forEach(([name, { handler, schema }]) => {
      server.tool(
        name,
        schema?.description || '',
        schema?.inputSchema || {},
        async (params: Record<string, unknown>) => {
          try {
            const result = await handler(params);
            return textResponse(JSON.stringify(result));
          } catch (error: unknown) {
            console.error(`Error in ${name}:`, error);
            const errorMessage = error instanceof Error ? error.message : `Error in ${name}`;
            throw new McpError(ErrorCode.InternalError, errorMessage);
          }
        }
      );
    });
  }
);

export { mcpHandler as GET, mcpHandler as POST, mcpHandler as DELETE };
