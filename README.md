# 🇮🇱 Bersaglio-Fin - Personal Financial Data MCP Server

[עברית (Hebrew)](./README.he.md)

[![License](https://img.shields.io/github/license/yonatan2021/Bersaglio-Fin?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Supported-orange?style=flat-square)](https://modelcontextprotocol.io/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

> **Get closer to your own data, on steroids!**

A secure, local-first financial data aggregator for Israeli banks and credit card companies, built with TypeScript and powered by [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers). Bersaglio-Fin helps you aggregate and analyze your financial transactions across multiple sources while keeping your data private and secure.

![demo](./.github/demo.gif)

---

## ✨ What's different in this fork?

- **Rebranding**: Complete migration from `asher-mcp` to `Bersaglio-Fin`.
- **Maintainer**: Now maintained by [@yonatan2021](https://github.com/yonatan2021).
- **Consolidated Documentation**: Integrated core architecture and security principles into the main README.
- **Enhanced Bot Capabilities**: Full-featured Telegram bot for mobile access and reporting.

## 🚀 Features

- **🤖 MCP Server**: Implements the Model Context Protocol for easy integration with MCP Hosts (e.g. Claude).
- **🇮🇱 Extensive Integration**: Supports all Israeli banks and credit card companies provided by [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers).
- **🏠 Local-First**: Your financial data never leaves your machine.
- **🔒 Encryption**: Sensitive data is encrypted at rest using SQLCipher (`better-sqlite3-multiple-ciphers`).
- **📱 Telegram Bot**: View accounts, budgets, and monthly reports on the go via a secure bot.
- **💻 CLI**: Easy setup and management via command line.
- **TypeScript**: Built with strict type safety and native ESM.

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [SQLite](https://www.sqlite.org/) with [SQLCipher](https://www.zetetic.net/sqlcipher/)
- **Scraping**: [israeli-bank-scrapers](https://github.com/eshaham/israeli-bank-scrapers)
- **Bot Framework**: [grammY](https://grammy.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

## 🏗 System Architecture

Bersaglio-Fin follows a local-first architecture with three consumer interfaces sharing a unified data layer:

- **Core Layer (`src/services/`)**: Contains shared business logic including `ScraperService` for bank scraping, `EncryptionKeyService` for in-memory key management, and `DatabaseService` for encrypted SQLite storage.
- **MCP Server (`src/mcp/`)**: The primary data access layer for AI agents like Claude Desktop or Hermes.
- **Telegram Bot (`src/bot/`)**: A view-only interface for mobile access, providing budget status and transaction reports.
- **Dashboard (`nextjs-mcp/`)**: A Next.js management UI for full configuration and detailed analytics.

## Prerequisites

- Node.js 18+
- npm

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yonatan2021/Bersaglio-Fin.git
   cd Bersaglio-Fin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. **Optional**: Install the system-wide `bersaglio` CLI command:
   ```bash
   npm install -g .
   ```

5. Install `tsx` (TypeScript Execute) globally (required for Claude desktop integration):
   ```bash
   npm install -g tsx
   ```

## Database Location

The database file is stored in the following location, depending on your OS:

- **macOS:** `~/Library/Application Support/Bersaglio-Fin/database.db`
- **Linux:** `~/.local/share/Bersaglio-Fin/database.db`
- **Windows:** `%APPDATA%/Bersaglio-Fin/database.db`

## First Run & Configuration

1. Prepare a `credentials.json` file with your provider credentials.
   See supported providers and credential fields [here](https://github.com/eshaham/israeli-bank-scrapers/blob/master/src/definitions.ts).

2. Ingest your credentials:
   ```bash
   bersaglio ingest-creds -f credentials.json
   ```
   - You will be prompted to enter an encryption key (minimum 6 characters).
   - This key is **never stored on disk** and must be provided each time the app starts.

3. During setup, you can:
   - Enable notifications for sync status.
   - Perform an initial scrape of all accounts.
   - Configure Claude Desktop integration automatically.

## Usage

### MCP Tools

Bersaglio-Fin provides several tools for MCP hosts (Claude, Hermes, etc.):

- `fetchTransactions`: Trigger bank scraping and update the local database.
- `sqlQuery`: Execute safe, read-only SELECT queries on the transactions table.
- `listTables` / `describeTable`: Explore the database schema.
- `fetch-last-month-transactions`: Get a summarized view of recent expenses.

### Telegram Bot

Configure your `BOT_TOKEN` and `ALLOWED_TELEGRAM_IDS` in `.env`, then run:
```bash
npm run start:bot
```
Available commands: `/report`, `/budget`, `/accounts`, `/sync`.

## Security & Privacy

- **Zero-Trust Local Storage**: All financial data is encrypted at rest using SQLCipher.
- **In-Memory Key**: The encryption key is held only in memory and cleared on process exit. It is never logged or networked.
- **SQL Validation**: An AST-based validator ensures only safe SELECT queries can be run, strictly allow-listing the `transactions` table and blocking access to credentials.
- **Local-Only**: No financial data or credentials ever leave your machine. No external LLM (like OpenAI or OpenRouter) is used for processing sensitive data.

## Development Conventions

- **Native ESM**: This project uses `"type": "module"`. All imports must include the `.js` extension.
- **Singleton Services**: All core services (Database, Scraper, Encryption) use the Singleton pattern.
- **Factory Pattern**: `DatabaseFactory` handles backend selection (SQLite by default, PostgreSQL optional).
- **Strict Typing**: No `any` types. Strict TypeScript mode is enforced.

## Credits

### Attribution
Bersaglio-Fin is a fork of [asher-mcp](https://github.com/shlomiuziel/asher-mcp) by [@shlomiuziel](https://github.com/shlomiuziel).
All core architecture and design originated from asher-mcp.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## ⚠️ Important Disclaimer

**PLEASE READ THIS DISCLAIMER CAREFULLY BEFORE USING THIS SOFTWARE.**

This software is designed to help you analyze your financial data and make it accessible to MCP hosts. However, by using this software, you acknowledge and agree to the following:

1. **No Warranty**: This software is provided "as is," without warranty of any kind, express or implied.
2. **Financial Data Security**: You are solely responsible for the security of your banking credentials and encryption keys.
3. **Use at Your Own Risk**: The developers are not responsible for any financial losses or data loss. Always verify important information through official bank channels.
4. **No Liability**: In no event shall the authors be liable for any claim or damages.
5. **Third-Party Services**: This software integrates with third-party bank scrapers. The developers are not responsible for their policies.

By using this software, you acknowledge that you have read this disclaimer and agree to be bound by its terms.
