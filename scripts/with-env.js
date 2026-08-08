#!/usr/bin/env node
'use strict';

/**
 * Loads an env file (default overrides anything already in process.env,
 * e.g. a stray `.env` picked up by a dependency) and then runs the given
 * command with that environment. Used to point the e2e DB/migration
 * scripts at `.env.test` instead of the `.env` used by `npm run dev`,
 * without needing a shell-specific way to set env vars (this repo is
 * developed on both Windows/PowerShell and Unix shells).
 *
 * Usage: node scripts/with-env.js <envFile> -- <command> [args...]
 */

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

const [, , envFile, ...rest] = process.argv;
const command = rest[0] === '--' ? rest.slice(1) : rest;

if (!envFile || command.length === 0) {
  console.error(
    'Usage: node scripts/with-env.js <envFile> -- <command> [args...]',
  );
  process.exit(1);
}

dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const result = spawnSync(command[0], command.slice(1), {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
