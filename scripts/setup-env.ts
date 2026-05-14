#!/usr/bin/env tsx
/** Standalone entry point for the .env setup wizard. Usage: npm run setup:env [--dry-run] [--force] */

import { Command } from 'commander';
import { runEnvWizard } from '../src/cli/commands/setupEnvWizard.js';

const program = new Command();

program
  .name('setup-env')
  .description('Interactive wizard to create or update your .env configuration')
  .option('--dry-run', 'Preview values without writing to disk')
  .option('--force', 'Write .env non-interactively using .env.example defaults (CI mode)')
  .action(async (opts: { dryRun?: boolean; force?: boolean }) => {
    await runEnvWizard({ dryRun: opts.dryRun, force: opts.force });
  });

program.parse(process.argv);
