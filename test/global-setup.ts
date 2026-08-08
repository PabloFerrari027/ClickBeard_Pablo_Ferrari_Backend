import { randomUUID } from 'node:crypto';
import path from 'node:path';

import * as bcrypt from 'bcrypt';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

// SequelizeMeta/SequelizeData track applied migrations/seeders — wiping
// them here would make sequelize-cli think nothing has ever run.
const NON_DATA_TABLES = ['SequelizeMeta', 'SequelizeData'];

/**
 * Runs once, before the whole e2e suite starts. Two jobs:
 *
 * 1. Load `.env.test` (overriding anything already in `process.env`, e.g.
 *    a stray `.env`) so every spec talks to the dedicated test database,
 *    never the dev DB from `.env`.
 * 2. Truncate every table left over from the previous run and re-seed the
 *    bootstrap admin, so each `npm run test:e2e` starts from a clean,
 *    deterministic state instead of accumulating data across runs (the
 *    admin is required by `getAdminSession` in test/support/api.helpers.ts).
 */
export default async function globalSetup(): Promise<void> {
  loadEnv({ path: path.resolve(__dirname, '../.env.test'), override: true });
  process.env.NODE_ENV = 'test';

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  try {
    await truncateAllTables(client);
    await seedAdmin(client);
  } finally {
    await client.end();
  }
}

async function truncateAllTables(client: Client): Promise<void> {
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );

  const tables = (rows as Array<{ tablename: string }>)
    .map((row) => row.tablename)
    .filter((tablename) => !NON_DATA_TABLES.includes(tablename));

  if (tables.length === 0) {
    return;
  }

  const identifiers = tables.map((tablename) => `"${tablename}"`).join(', ');
  await client.query(`TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`);
}

/** Mirrors database/seeders/20260807090000-seed-initial-admin.js. */
async function seedAdmin(client: Client): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD must be set in .env.test to seed the bootstrap admin for e2e tests.',
    );
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  await client.query(
    `INSERT INTO users (id, name, email, password_hash, role, active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'ADMIN', true, now(), now())`,
    [randomUUID(), name, email, passwordHash],
  );
}
