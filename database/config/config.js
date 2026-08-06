require('dotenv/config');

/**
 * Read by sequelize-cli only (via .sequelizerc), for migrations/seeders.
 * The running application never imports this file — it builds its own
 * connection options from `EnvConfig` (see
 * src/shared/infrastructure/database/database.module.ts) so both paths
 * must be kept in sync by hand when a connection setting changes.
 */
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'postgres',
  dialectOptions:
    process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
};

module.exports = {
  development: { ...base, logging: console.log },
  test: { ...base, logging: false },
  production: { ...base, logging: false },
};
