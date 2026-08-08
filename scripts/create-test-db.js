#!/usr/bin/env node
'use strict';

/**
 * Idempotently creates the dedicated e2e test database (`DB_NAME` in
 * `.env.test`) inside the same Postgres container used for dev. Runs as
 * part of `pretest:e2e`, so `npm run test:e2e` never needs a manual setup
 * step and never falls back to the dev database if this one is missing.
 *
 * `CREATE DATABASE` has no `IF NOT EXISTS` in Postgres, so a "database
 * already exists" error (42P04) is caught and treated as success.
 */

const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});

const DUPLICATE_DATABASE = '42P04';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();

  try {
    await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
    console.log(`Created test database "${process.env.DB_NAME}".`);
  } catch (error) {
    if (error.code === DUPLICATE_DATABASE) {
      console.log(`Test database "${process.env.DB_NAME}" already exists.`);
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
