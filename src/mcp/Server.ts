import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import israeliBankScrapers from 'israeli-bank-scrapers';
import { z } from 'zod';
const { CompanyTypes } = israeliBankScrapers;
import { DatabaseFactory } from '../services/DatabaseFactory.js';
import { DatabaseService } from '../interfaces/DatabaseService.js';
import { PostgreSQLDatabaseService } from '../services/PostgreSQLDatabaseService.js';
import { encryptionKeyService } from '../services/EncryptionKeyService.js';
import '../utils/consoleRedirect.js';
import { configureLogger } from '../utils/logger.js';
configureLogger({ enableConsoleOutput: true });

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

class Server {
  private server: McpServer;
  private databaseService: DatabaseService;
  private tools: Map<string, { handler: ToolHandler; schema?: ToolSchema }> = new Map();

  constructor() {
    this.server = new McpServer({
      name: 'asher-mcp-server',
      version: '1.0.0',
    });

    this.databaseService = DatabaseFactory.getInstance();
    this.setupTools();
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.server.server.onerror = (error: Error) => {
      console.error('[Error] MCP Server error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private textResponse(text: string): { content: TextContent[] } {
    return {
      content: [{ type: 'text', text }],
    };
  }

  private registerTool(name: string, handler: ToolHandler, schema?: ToolSchema) {
    this.tools.set(name, { handler, schema });

    const { description, inputSchema } = schema || {};

    this.server.tool(
      name,
      description || '',
      inputSchema || {},
      async (params: Record<string, unknown>) => {
        try {
          const result = await handler(params);
          return this.textResponse(JSON.stringify(result));
        } catch (error: any) {
          console.error(`Error in ${name}:`, error);
          throw new McpError(ErrorCode.InternalError, error.message || `Error in ${name}`);
        }
      }
    );
  }

  /**
   * Executes a database operation using DatabaseService methods
   * @param fn Function that performs database operations using DatabaseService
   * @returns The result of the database operation
   */
  private async withDb<T>(fn: (db: DatabaseService) => Promise<T> | T): Promise<T> {
    // Only ensure encryption key for SQLite
    if (!(this.databaseService instanceof PostgreSQLDatabaseService)) {
      await encryptionKeyService.ensureKeyIsAvailable();
    }
    await this.databaseService.initialize();
    return fn(this.databaseService);
  }

  private setupTools() {
    this.registerTool(
      'listTables',
      async () => {
        return this.withDb(async db => {
          const result = await db.listTables();
          if (!result.success) {
            throw new Error(result.error || 'Failed to list tables');
          }
          return { success: true, data: { tables: result.tables } };
        });
      },
      {
        description:
          'List all tables in the database. Expected tables: transactions, budgets, manual_transactions, scraper_credentials, sync_state.',
      }
    );

    this.registerTool(
      'getTableSchema',
      async (params: Record<string, unknown>) => {
        const { table } = params as { table: string };
        if (!table) {
          throw new Error('Table name is required');
        }
        return this.withDb(async db => {
          const result = await db.executeSafeSelectQuery(`PRAGMA table_info(${table})`);
          if (!result.success) {
            throw new Error(result.error || 'Failed to get table schema');
          }
          return { success: true, data: { schema: result.data } };
        });
      },
      {
        description: 'Get the schema for a specific table',
        inputSchema: {
          table: z.string().describe('Name of the table to get schema for'),
        },
      }
    );

    this.registerTool(
      'sqlQuery',
      async (params: Record<string, unknown>) => {
        const { query } = params as { query: string };
        if (!query) {
          throw new Error('Query is required');
        }

        return this.withDb(async db => {
          const result = await db.executeSafeSelectQuery(query);
          if (!result.success) {
            throw new Error(result.error || 'Query execution failed');
          }
          return { success: true, data: result.data };
        });
      },
      {
        description:
          'Execute a safe SELECT-only query. Allowed tables: transactions. Columns: id, date, processedDate, description, memo, originalAmount, originalCurrency, chargedAmount, currency, category, status, type, scraper_credential_id, created_at, updated_at.',
        inputSchema: {
          query: z.string().describe('SQL SELECT query (transactions table only)'),
        },
      }
    );

    this.registerTool(
      'describeTable',
      async (params: Record<string, unknown>) => {
        const { table } = params as { table: string };
        if (!table) {
          throw new Error('Table name is required');
        }
        return this.withDb(async db => {
          const columnsResult = await db.executeSafeSelectQuery(`PRAGMA table_info(${table})`);
          const indexesResult = await db.executeSafeSelectQuery(`PRAGMA index_list(${table})`);

          if (!columnsResult.success) {
            throw new Error(columnsResult.error || 'Failed to get table columns');
          }
          if (!indexesResult.success) {
            throw new Error(indexesResult.error || 'Failed to get table indexes');
          }

          return {
            success: true,
            data: {
              columns: columnsResult.data,
              indexes: indexesResult.data,
            },
          };
        });
      },
      {
        description: 'Get detailed information about a table including columns and indexes',
        inputSchema: {
          table: z.string().describe('Name of the table to describe'),
        },
      }
    );

    this.registerTool(
      'listScrapers',
      async () => {
        const scrapers = Object.entries(CompanyTypes)
          .filter(([key]) => isNaN(Number(key)))
          .map(([key]) => key);

        return { success: true, data: { scrapers } };
      },
      {
        description:
          'List all bank scraper types available in the library (not necessarily configured). To see which banks are actually connected, use getConfiguredBanks instead.',
        inputSchema: {},
      }
    );

    this.registerTool(
      'fetchTransactions',
      async (params: Record<string, unknown>) => {
        const { startDate, scraperName } = params as {
          startDate?: string;
          scraperName?: string;
        };
        return this.withDb(async () => {
          try {
            const { scraperService } = await import('../services/ScraperService.js');

            const result = await scraperService.fetchAllTransactions({
              overrideStartDate: startDate ? new Date(startDate) : undefined,
              scraperName,
            });

            return {
              success: result.success,
              data: {
                results: result.results.map(r => ({
                  scraper: r.scraper,
                  friendlyName: r.friendlyName,
                  success: r.success,
                  error: r.error,
                  errorType: r.errorType,
                  transactionCount:
                    r.accounts?.reduce((sum, acc) => sum + (acc.txns?.length || 0), 0) || 0,
                })),
                totalTransactions: result.results.reduce(
                  (sum, r) =>
                    sum + (r.accounts?.reduce((s, acc) => s + (acc.txns?.length || 0), 0) || 0),
                  0
                ),
              },
            };
          } catch (error: any) {
            console.error('Error in fetchTransactions:', error);
            return {
              success: false,
              error: error.message || 'Unknown error occurred',
              errorType: error.name || 'ScraperError',
            };
          }
        });
      },
      {
        description:
          'Scrape and save transactions from configured bank accounts. By default fetches from last sync point (incremental). Use startDate to override, scraperName to target one bank. Check getSyncState first to avoid concurrent syncs.',
        inputSchema: {
          startDate: z
            .string()
            .optional()
            .describe(
              'Override start date (ISO format, e.g. "2025-01-01"). Defaults to last sync timestamp.'
            ),
          scraperName: z
            .string()
            .optional()
            .describe(
              'Friendly name of a specific bank to sync (from getConfiguredBanks). Defaults to all banks.'
            ),
        },
      }
    );

    this.registerTool(
      'getBudgets',
      async () => {
        return this.withDb(async db => {
          const result = await db.getBudgets();
          if (!result.success) {
            throw new Error(result.error || 'Failed to get budgets');
          }
          return { success: true, data: result.data };
        });
      },
      {
        description:
          'Get all monthly budget limits by category. Returns {category, monthly_limit}[]. Use alongside sqlQuery on transactions to compare actual spending vs limits.',
      }
    );

    this.registerTool(
      'setBudget',
      async (params: Record<string, unknown>) => {
        const { category, monthlyLimit } = params as { category: string; monthlyLimit: number };
        if (!category) throw new Error('category is required');
        if (typeof monthlyLimit !== 'number') throw new Error('monthlyLimit must be a number');
        return this.withDb(async db => {
          const result = await db.upsertBudget(category, monthlyLimit);
          if (!result.success) {
            throw new Error(result.error || 'Failed to set budget');
          }
          return { success: true };
        });
      },
      {
        description:
          'Set or update a monthly budget limit for a spending category. Category should match values used in transactions (e.g. "food", "transport", "entertainment").',
        inputSchema: {
          category: z.string().describe('Expense category name'),
          monthlyLimit: z.number().describe('Monthly spending limit in ILS'),
        },
      }
    );

    this.registerTool(
      'getManualTransactions',
      async (params: Record<string, unknown>) => {
        const { startDate, endDate } = params as { startDate?: string; endDate?: string };
        return this.withDb(async db => {
          const result = await db.getManualTransactions(startDate, endDate);
          if (!result.success) {
            throw new Error(result.error || 'Failed to get manual transactions');
          }
          return { success: true, data: result.data };
        });
      },
      {
        description:
          'Get manually added transactions (cash, transfers, etc.). Returns {id, date, amount, currency, description, category, created_at}[].',
        inputSchema: {
          startDate: z
            .string()
            .optional()
            .describe('Start date filter (ISO format, e.g. "2025-01-01")'),
          endDate: z
            .string()
            .optional()
            .describe('End date filter (ISO format, e.g. "2025-12-31")'),
        },
      }
    );

    this.registerTool(
      'addManualTransaction',
      async (params: Record<string, unknown>) => {
        const { date, amount, currency, description, category } = params as {
          date: string;
          amount: number;
          currency: string;
          description: string;
          category: string;
        };
        if (!date) throw new Error('date is required');
        if (typeof amount !== 'number') throw new Error('amount must be a number');
        if (!currency) throw new Error('currency is required');
        if (!description) throw new Error('description is required');
        if (!category) throw new Error('category is required');
        return this.withDb(async db => {
          const result = await db.createManualTransaction({
            date,
            amount,
            currency,
            description,
            category,
          });
          if (!result.success) {
            throw new Error(result.error || 'Failed to create manual transaction');
          }
          return { success: true, data: { id: result.data } };
        });
      },
      {
        description:
          'Add a manual transaction not tracked by bank scrapers (cash purchase, peer transfer, etc.). Amount negative for expense, positive for income.',
        inputSchema: {
          date: z.string().describe('Transaction date (ISO format, e.g. "2025-06-15")'),
          amount: z.number().describe('Amount — negative for expense, positive for income'),
          currency: z.string().describe('Currency code (e.g. "ILS", "USD")'),
          description: z.string().describe('Transaction description'),
          category: z.string().describe('Expense category (e.g. "food", "transport")'),
        },
      }
    );

    this.registerTool(
      'getConfiguredBanks',
      async () => {
        return this.withDb(async db => {
          const rows = await db.query<{
            friendly_name: string;
            scraper_type: string;
            last_scraped_timestamp: string | null;
          }>(
            'SELECT friendly_name, scraper_type, last_scraped_timestamp FROM scraper_credentials WHERE credentials IS NOT NULL'
          );
          return {
            success: true,
            data: rows.map(r => ({
              friendlyName: r.friendly_name,
              scraperType: r.scraper_type,
              lastSyncedAt: r.last_scraped_timestamp,
            })),
          };
        });
      },
      {
        description:
          'List configured bank connections — friendly name, scraper type, last sync timestamp. Never returns credentials. Call this before fetchTransactions to know which banks are active and when they last synced.',
      }
    );

    this.registerTool(
      'getSyncState',
      async () => {
        return this.withDb(async db => {
          const state = db.readSyncState();
          return { success: true, data: state };
        });
      },
      {
        description:
          'Get current transaction sync status. Returns {status: "idle"|"running"|"error", started_at, completed_at, results, error}. Always call this before fetchTransactions to avoid triggering a concurrent sync.',
      }
    );

    this.server.prompt('fetch-last-month-transactions', () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Fetch transactions from the last month and calculate the total expenses. Make sure to:
                      1. Query the database for transactions within the last month's date range
                      2. Filter for expenses (negative amounts)
                      3. Sum up the total expenses
                      4. Return a summary including:
                        - Total expenses amount
                        - Number of transactions
                        - List of transactions with dates and amounts`,
          },
        },
      ],
    }));
  }

  public async start() {
    try {
      const httpPort = process.env.MCP_HTTP_PORT ? Number(process.env.MCP_HTTP_PORT) : null;

      if (httpPort) {
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        await this.server.connect(transport);

        const httpServer = http.createServer(async (req, res) => {
          await transport.handleRequest(req, res);
        });

        await new Promise<void>(resolve => httpServer.listen(httpPort, resolve));
        console.error(`MCP HTTP server running on port ${httpPort}`);
      } else {
        await this.server.connect(new StdioServerTransport());
        console.error('MCP Server started successfully');
      }
    } catch (error) {
      console.error('Failed to start MCP Server:', error);
      throw error;
    }
  }

  public async close() {
    await this.server.close();
  }
}

// Check if this file is being run directly (ES module equivalent of require.main === module)
const isMain = process.argv[1] && process.argv[1] === new URL(import.meta.url).pathname;

// Main function to start the server when run directly
async function main() {
  console.log('Starting MCP Server...');

  try {
    const server = new Server();

    // Handle process termination
    // const shutdown = async (signal: string) => {
    //   console.log(`\nReceived ${signal}, shutting down...`);
    //   try {
    //     await server.close();
    //     console.log('MCP Server stopped');
    //     process.exit(0);
    //   } catch (error) {
    //     console.error('Error during shutdown:', error);
    //     process.exit(1);
    //   }
    // };

    // // Set up signal handlers
    // process.on('SIGINT', () => void shutdown('SIGINT'));
    // process.on('SIGTERM', () => void shutdown('SIGTERM'));

    // Start the server
    await server.start();
    console.log('MCP Server is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

if (isMain) {
  main().catch(error => {
    console.error('Unhandled error in MCP server:', error);
    process.exit(1);
  });
}

export { Server };
