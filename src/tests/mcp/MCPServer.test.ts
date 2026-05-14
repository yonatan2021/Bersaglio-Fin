import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server as MCPServer } from '../../mcp/Server.js';
import { DatabaseFactory } from '../../services/DatabaseFactory.js';
import { encryptionKeyService } from '../../services/EncryptionKeyService.js';

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    tool: vi.fn(),
    prompt: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    server: { onerror: null },
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    onRequest: vi.fn(),
  })),
}));

vi.mock('../../services/DatabaseFactory.js', () => ({
  DatabaseFactory: { getInstance: vi.fn() },
}));

vi.mock('../../services/EncryptionKeyService.js', () => ({
  encryptionKeyService: { ensureKeyIsAvailable: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../services/ScraperService.js', () => ({
  scraperService: {
    fetchAllTransactions: vi.fn().mockResolvedValue({
      success: true,
      results: [
        {
          scraper: 'hapoalim',
          friendlyName: 'Hapoalim',
          success: true,
          accounts: [{ txns: [{ id: '1' }, { id: '2' }] }],
        },
      ],
    }),
  },
}));

describe('MCPServer', () => {
  let server: MCPServer;
  let mockDb: any;
  let mockMcpServer: any;

  const getHandler = (toolName: string) => {
    const calls = mockMcpServer.tool.mock.calls;
    const call = calls.find((c: any[]) => c[0] === toolName);
    expect(call).toBeDefined();
    return call[3]; // 4th arg = handler
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      initialize: vi.fn().mockResolvedValue(undefined),
      listTables: vi.fn().mockResolvedValue({ success: true, tables: ['transactions', 'budgets'] }),
      executeSafeSelectQuery: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getBudgets: vi.fn().mockResolvedValue({
        success: true,
        data: [{ category: 'food', monthly_limit: 2000 }],
      }),
      upsertBudget: vi.fn().mockResolvedValue({ success: true }),
      getManualTransactions: vi
        .fn()
        .mockResolvedValue({ success: true, data: [{ id: 1, amount: -50, description: 'cash' }] }),
      createManualTransaction: vi.fn().mockResolvedValue({ success: true, data: 42 }),
      query: vi.fn().mockResolvedValue([
        {
          friendly_name: 'Hapoalim',
          scraper_type: 'hapoalim',
          last_scraped_timestamp: '2026-05-01T00:00:00.000Z',
        },
      ]),
      readSyncState: vi.fn().mockReturnValue({
        status: 'idle',
        started_at: null,
        completed_at: '2026-05-01T10:00:00.000Z',
        results: null,
        error: null,
      }),
    };

    (DatabaseFactory.getInstance as any).mockReturnValue(mockDb);
    (encryptionKeyService.ensureKeyIsAvailable as any).mockResolvedValue(undefined);

    server = new MCPServer();
    mockMcpServer = (server as any).server;
  });

  describe('Server lifecycle', () => {
    it('starts successfully via stdio', async () => {
      await server.start();
      expect(mockMcpServer.connect).toHaveBeenCalled();
    });

    it('propagates transport errors on start', async () => {
      mockMcpServer.connect.mockRejectedValueOnce(new Error('Transport error'));
      await expect(server.start()).rejects.toThrow('Transport error');
    });
  });

  describe('Tool registration — all 12 tools present', () => {
    const expectedTools = [
      'listTables',
      'getTableSchema',
      'sqlQuery',
      'describeTable',
      'listScrapers',
      'fetchTransactions',
      'getBudgets',
      'setBudget',
      'getManualTransactions',
      'addManualTransaction',
      'getConfiguredBanks',
      'getSyncState',
    ];

    for (const toolName of expectedTools) {
      it(`registers ${toolName}`, () => {
        const calls = mockMcpServer.tool.mock.calls;
        expect(calls.find((c: any[]) => c[0] === toolName)).toBeDefined();
      });
    }
  });

  describe('listTables handler', () => {
    it('returns table list from db', async () => {
      const handler = getHandler('listTables');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.success).toBe(true);
      expect(result.data.tables).toContain('transactions');
      expect(mockDb.listTables).toHaveBeenCalled();
    });

    it('throws when db returns failure', async () => {
      mockDb.listTables.mockResolvedValueOnce({ success: false, error: 'db error' });
      const handler = getHandler('listTables');
      await expect(handler({})).rejects.toThrow('db error');
    });
  });

  describe('sqlQuery handler', () => {
    it('executes query and returns data', async () => {
      mockDb.executeSafeSelectQuery.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1 }],
      });
      const handler = getHandler('sqlQuery');
      const result = JSON.parse(
        (await handler({ query: 'SELECT * FROM transactions' })).content[0].text
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1 }]);
    });

    it('throws when query is missing', async () => {
      const handler = getHandler('sqlQuery');
      await expect(handler({})).rejects.toThrow('Query is required');
    });

    it('throws when db rejects query', async () => {
      mockDb.executeSafeSelectQuery.mockResolvedValueOnce({
        success: false,
        error: 'Access to table not allowed',
      });
      const handler = getHandler('sqlQuery');
      await expect(handler({ query: 'SELECT * FROM budgets' })).rejects.toThrow(
        'Access to table not allowed'
      );
    });
  });

  describe('fetchTransactions handler', () => {
    it('calls scraperService with no params by default', async () => {
      const { scraperService } = await import('../../services/ScraperService.js');
      const handler = getHandler('fetchTransactions');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.success).toBe(true);
      expect(scraperService.fetchAllTransactions).toHaveBeenCalledWith({
        overrideStartDate: undefined,
        scraperName: undefined,
      });
    });

    it('passes startDate and scraperName when provided', async () => {
      const { scraperService } = await import('../../services/ScraperService.js');
      const handler = getHandler('fetchTransactions');
      await handler({ startDate: '2026-01-01', scraperName: 'Hapoalim' });
      expect(scraperService.fetchAllTransactions).toHaveBeenCalledWith({
        overrideStartDate: new Date('2026-01-01'),
        scraperName: 'Hapoalim',
      });
    });

    it('returns correct transactionCount per scraper', async () => {
      const handler = getHandler('fetchTransactions');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.data.results[0].transactionCount).toBe(2);
      expect(result.data.totalTransactions).toBe(2);
    });
  });

  describe('getBudgets handler', () => {
    it('returns budgets from db', async () => {
      const handler = getHandler('getBudgets');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.success).toBe(true);
      expect(result.data[0].category).toBe('food');
      expect(mockDb.getBudgets).toHaveBeenCalled();
    });

    it('throws when db returns failure', async () => {
      mockDb.getBudgets.mockResolvedValueOnce({ success: false, error: 'budget error' });
      const handler = getHandler('getBudgets');
      await expect(handler({})).rejects.toThrow('budget error');
    });
  });

  describe('setBudget handler', () => {
    it('calls upsertBudget with correct args', async () => {
      const handler = getHandler('setBudget');
      const result = JSON.parse(
        (await handler({ category: 'food', monthlyLimit: 3000 })).content[0].text
      );
      expect(result.success).toBe(true);
      expect(mockDb.upsertBudget).toHaveBeenCalledWith('food', 3000);
    });

    it('throws when category missing', async () => {
      const handler = getHandler('setBudget');
      await expect(handler({ monthlyLimit: 1000 })).rejects.toThrow('category is required');
    });

    it('throws when monthlyLimit is not a number', async () => {
      const handler = getHandler('setBudget');
      await expect(handler({ category: 'food', monthlyLimit: 'abc' })).rejects.toThrow(
        'monthlyLimit must be a number'
      );
    });

    it('throws when db returns failure', async () => {
      mockDb.upsertBudget.mockResolvedValueOnce({ success: false, error: 'write error' });
      const handler = getHandler('setBudget');
      await expect(handler({ category: 'food', monthlyLimit: 1000 })).rejects.toThrow(
        'write error'
      );
    });
  });

  describe('getManualTransactions handler', () => {
    it('returns manual transactions with no filters', async () => {
      const handler = getHandler('getManualTransactions');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.success).toBe(true);
      expect(result.data[0].description).toBe('cash');
      expect(mockDb.getManualTransactions).toHaveBeenCalledWith(undefined, undefined);
    });

    it('passes date filters to db', async () => {
      const handler = getHandler('getManualTransactions');
      await handler({ startDate: '2026-01-01', endDate: '2026-01-31' });
      expect(mockDb.getManualTransactions).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
    });

    it('throws when db returns failure', async () => {
      mockDb.getManualTransactions.mockResolvedValueOnce({ success: false, error: 'query error' });
      const handler = getHandler('getManualTransactions');
      await expect(handler({})).rejects.toThrow('query error');
    });
  });

  describe('addManualTransaction handler', () => {
    const validTx = {
      date: '2026-05-10',
      amount: -120,
      currency: 'ILS',
      description: 'Supermarket',
      category: 'food',
    };

    it('creates transaction and returns id', async () => {
      const handler = getHandler('addManualTransaction');
      const result = JSON.parse((await handler(validTx)).content[0].text);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(42);
      expect(mockDb.createManualTransaction).toHaveBeenCalledWith(validTx);
    });

    it('throws when date missing', async () => {
      const handler = getHandler('addManualTransaction');
      const { date: _, ...noDate } = validTx;
      await expect(handler(noDate)).rejects.toThrow('date is required');
    });

    it('throws when amount is not a number', async () => {
      const handler = getHandler('addManualTransaction');
      await expect(handler({ ...validTx, amount: 'abc' })).rejects.toThrow(
        'amount must be a number'
      );
    });

    it('throws when currency missing', async () => {
      const handler = getHandler('addManualTransaction');
      const { currency: _, ...noCurrency } = validTx;
      await expect(handler(noCurrency)).rejects.toThrow('currency is required');
    });

    it('throws when description missing', async () => {
      const handler = getHandler('addManualTransaction');
      const { description: _, ...noDesc } = validTx;
      await expect(handler(noDesc)).rejects.toThrow('description is required');
    });

    it('throws when category missing', async () => {
      const handler = getHandler('addManualTransaction');
      const { category: _, ...noCat } = validTx;
      await expect(handler(noCat)).rejects.toThrow('category is required');
    });

    it('throws when db returns failure', async () => {
      mockDb.createManualTransaction.mockResolvedValueOnce({
        success: false,
        error: 'insert error',
      });
      const handler = getHandler('addManualTransaction');
      await expect(handler(validTx)).rejects.toThrow('insert error');
    });
  });

  describe('getConfiguredBanks handler', () => {
    it('returns bank list without credentials', async () => {
      const handler = getHandler('getConfiguredBanks');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.success).toBe(true);
      expect(result.data[0].friendlyName).toBe('Hapoalim');
      expect(result.data[0].scraperType).toBe('hapoalim');
      expect(result.data[0].lastSyncedAt).toBe('2026-05-01T00:00:00.000Z');
      // credentials must never appear
      expect(result.data[0].credentials).toBeUndefined();
    });

    it('queries only safe columns (credentials not in SELECT list)', async () => {
      const handler = getHandler('getConfiguredBanks');
      await handler({});
      const sqlArg = mockDb.query.mock.calls[0][0] as string;
      // Extract the SELECT column list (between SELECT and FROM)
      const selectPart = sqlArg.replace(/\s+/g, ' ').match(/SELECT\s+(.+?)\s+FROM/i)?.[1] ?? '';
      expect(selectPart).not.toContain('credentials');
      expect(selectPart).toContain('friendly_name');
      expect(selectPart).toContain('scraper_type');
      expect(selectPart).toContain('last_scraped_timestamp');
    });
  });

  describe('getSyncState handler', () => {
    it('returns sync state from db', async () => {
      const handler = getHandler('getSyncState');
      const result = JSON.parse((await handler({})).content[0].text);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('idle');
      expect(result.data.completed_at).toBe('2026-05-01T10:00:00.000Z');
      expect(mockDb.readSyncState).toHaveBeenCalled();
    });
  });
});
