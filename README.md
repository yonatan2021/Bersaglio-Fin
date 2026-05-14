# Bersaglio-Fin — Personal Finance System

[עברית](./README.he.md)

[![License](https://img.shields.io/github/license/yonatan2021/Bersaglio-Fin?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Supported-orange?style=flat-square)](https://modelcontextprotocol.io/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

> Aggregate, analyze, and manage your Israeli bank data — entirely on your own machine.

Bersaglio-Fin scrapes transaction data from Israeli banks and credit cards, stores it in an encrypted local SQLite database, and exposes it through three interfaces: an MCP server (for Claude), a Telegram bot (for mobile access), and a Next.js dashboard (for management). Nothing is sent to external servers.

Built on [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers).

---

## What's Working Now

| Component | Status | Description |
|-----------|--------|-------------|
| MCP Server | ✅ Working | stdio (Claude Desktop) + HTTP on port 3001 |
| Telegram Bot | ✅ Working | All 7 commands implemented |
| Dashboard | ✅ Built | 5 pages: overview, accounts, budget, transactions, settings |
| `fin` CLI | ✅ Working | Start/stop services, sync, setup, diagnostics |
| Services Layer | ✅ Working | Scraper, database, encryption — well tested |
| Hermes Agent | 🔜 Planned | Personal AI agent, will connect via MCP |

---

## Architecture

Three interfaces, one encrypted local database:

```
Israeli Banks (Hapoalim, Leumi, Discount, Max, Isracard…)
        │ israeli-bank-scrapers
        ▼
   ScraperService  +  EncryptionKeyService  +  DatabaseService
        │
        ├─── MCP Server (Claude Desktop / Hermes)
        ├─── Telegram Bot (mobile, view-only)
        └─── Dashboard (Next.js, management)
```

**Boundary rule:** The bot is view-only — no credentials ever pass through it. All configuration (adding banks, setting budgets) lives in the dashboard. The MCP server is the data access layer for AI agents.

---

## Prerequisites

- Node.js 18+
- npm
- Chromium — installed automatically by the scraper library (via Playwright)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yonatan2021/Bersaglio-Fin.git
cd Bersaglio-Fin
npm install
npm run build
```

### 2. Install the `fin` CLI globally

```bash
npm install -g .
```

Verify: `fin --help`

### 3. Create a `.env` file

```bash
cp .env.example .env
```

For the Telegram bot, fill in:

```env
BOT_TOKEN=your_telegram_bot_token
ALLOWED_TELEGRAM_IDS=123456789,987654321
```

Get a bot token from [@BotFather](https://t.me/BotFather). Get your Telegram user ID from [@userinfobot](https://t.me/userinfobot).

### 4. Set up bank credentials

Create a `credentials.json` file (see `examples/` for the format), then:

```bash
fin setup creds -f credentials.json
```

You'll be prompted to choose an encryption key (min 6 characters). **This key is never saved to disk** — you enter it each time the app starts.

### 5. Configure Claude Desktop (optional)

```bash
fin setup claude
```

This writes the MCP server entry to Claude Desktop's config automatically.

### 6. Initialize the database

```bash
fin setup db
```

### 7. Start services

```bash
fin start all          # MCP server + bot + dashboard
```

Or individually:

```bash
fin start mcp          # MCP server (HTTP, port 3001)
fin start bot          # Telegram bot (detached)
fin start dashboard    # Dashboard at localhost:3000
```

---

## `fin` CLI Reference

```bash
fin                        # Interactive Hebrew menu
fin start bot              # Start Telegram bot (detached, PID in ~/.fin/pids/)
fin start mcp              # Start MCP server (HTTP, port 3001)
fin start dashboard        # Start Next.js dashboard (port 3000)
fin start all              # Start all three services
fin stop all               # Stop all services
fin restart mcp            # Restart a specific service
fin status                 # Show all services: running/stopped + uptime

fin sync                   # Sync transactions from all configured banks

fin setup creds -f <path>  # Add/update bank credentials from JSON file
fin setup claude           # Register MCP server with Claude Desktop
fin setup db               # Initialize or verify the database
fin setup test             # Full system health check

fin diag db                # Database connectivity check
fin diag mcp               # MCP server health check
fin diag notify            # Test macOS notification
```

---

## Telegram Bot

Start: `fin start bot`

| Command | What it does |
|---------|-------------|
| `/start` | Main menu |
| `/accounts` | List connected bank accounts |
| `/budget` | Monthly budget vs. actual spending |
| `/report` | Monthly transaction report |
| `/sync` | Trigger bank sync |
| `/add` | Add a manual expense |
| `/help` | Help text |
| `/cancel` | Cancel current operation |

Only Telegram IDs listed in `ALLOWED_TELEGRAM_IDS` can interact with the bot.

---

## Dashboard

Start: `fin start dashboard` or `cd nextjs-mcp && npm run dev` → http://localhost:3000

The dashboard has its own `node_modules`. Run `cd nextjs-mcp && npm install` on first use.

| Page | What it does |
|------|-------------|
| `/` | Spending overview, top categories, recent transactions, sync trigger |
| `/accounts` | Connect/remove banks, sync all, last sync time |
| `/budget` | Set monthly limits per category, view progress |
| `/transactions` | Full transaction list, date filter, CSV export |
| `/settings` | Lock database, Claude Desktop MCP info, wipe data |

---

## MCP Server

For Claude Desktop (stdio mode):

```bash
npm run start:mcp           # stdio — Claude Desktop only
npm run start:mcp:inspector # Open MCP debug tool in browser
```

For HTTP mode (port 3001): `fin start mcp`

### MCP Tools

| Tool | What it does |
|------|-------------|
| `fetchTransactions` | Scrape banks and update local database |
| `sqlQuery` | Read-only SELECT on the `transactions` table |
| `listTables` | List all database tables |
| `describeTable` | Columns and indexes for a table |
| `getTableSchema` | Full DDL of a table |
| `listScrapers` | List configured bank scrapers |
| `fetch-last-month-transactions` | Prompt: fetch and summarize last month |

---

## Credentials File Format

```json
[
  {
    "scraper_type": "hapoalim",
    "friendly_name": "My Hapoalim",
    "credentials": {
      "userCode": "your_user_code",
      "password": "your_password"
    }
  },
  {
    "scraper_type": "visaCal",
    "friendly_name": "Visa Cal",
    "credentials": {
      "username": "your_username",
      "password": "your_password"
    }
  }
]
```

Supported scrapers: `hapoalim`, `leumi`, `discount`, `mercantile`, `mizrahi`, `beinleumi`, `massad`, `otsarHahayal`, `visaCal`, `max`, `isracard`, `amex`, `yahav`, `beyhadBishvilha`.

Field requirements per scraper: [israeli-bank-scrapers definitions](https://github.com/eshaham/israeli-bank-scrapers/blob/master/src/definitions.ts).

---

## Database

Stored at:
- **macOS:** `~/Library/Application Support/Asher/transactions.db`
- **Linux:** `~/.local/share/Asher/transactions.db`
- **Windows:** `%APPDATA%/Asher/transactions.db`

Encrypted with SQLCipher (`better-sqlite3-multiple-ciphers`). Encryption key lives in memory only — enter at startup, cleared when process exits.

**Optional PostgreSQL:** Set `DATABASE_URL=postgres://user:pass@localhost:5432/db` in `.env` — the app switches backends automatically.

---

## Security

- **Encryption key in memory only** — never written to disk, never logged, never sent over network
- **Credentials blocked from MCP** — `scraper_credentials` table excluded from `sqlQuery` allowlist
- **AST-based SQL validation** — only `SELECT` on `transactions` table allowed
- **DB file permissions** — `chmod 600` (owner read/write only)
- **Bot auth** — `ALLOWED_TELEGRAM_IDS` checked before any handler runs
- **Local only** — no financial data ever leaves your machine

See [doc/SECURITY.md](./doc/SECURITY.md) for the full threat model.

---

## Development

```bash
npm run build      # Compile TypeScript
npm run typecheck  # Type check without building
npm run lint       # Lint and fix
npm run format     # Format with Prettier
npm test           # Run all tests (Vitest)
npm run test:watch # Watch mode
```

Project structure:

```
src/
├── bot/           — Telegram bot (Grammy)
├── cli/           — fin CLI (Commander.js)
├── mcp/           — MCP server
├── services/      — Shared business logic (DB, scraper, encryption)
├── utils/         — Logger, SQL validation, notifications
├── schemas.ts     — Zod validation for 14 bank credential types
└── types.ts       — Shared TypeScript types

nextjs-mcp/        — Dashboard (Next.js 15, App Router, Tailwind 4)
doc/               — Architecture, security, conventions docs
```

**ESM only** — `"type": "module"`. Imports need `.js` extensions (even for `.ts` files).

Pre-commit hooks run lint + format automatically (Husky + lint-staged).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 (strict, ESM) |
| Database | SQLite + SQLCipher (`better-sqlite3-multiple-ciphers`) |
| Scraping | [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers) |
| MCP | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| Bot | [grammY](https://grammy.dev/) |
| Dashboard | Next.js 15, Tailwind CSS 4, App Router |
| Testing | [Vitest](https://vitest.dev/) |
| CLI | Commander.js + Inquirer |

---

## Credits

Bersaglio-Fin is a fork of [asher-mcp](https://github.com/shlomiuziel/asher-mcp) by [@shlomiuziel](https://github.com/shlomiuziel). Core architecture and design originated from asher-mcp.

Maintained by [@yonatan2021](https://github.com/yonatan2021).

---

## License

MIT. See [LICENSE](./LICENSE).

---

## Disclaimer

This software is provided "as is," without warranty of any kind. You are solely responsible for the security of your banking credentials and encryption keys. The developers are not responsible for any financial losses or data loss. Always verify important financial information through official bank channels. This software integrates with third-party bank scrapers whose policies are outside the developers' control.
