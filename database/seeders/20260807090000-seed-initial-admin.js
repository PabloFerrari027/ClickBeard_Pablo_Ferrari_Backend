'use strict';

const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

/**
 * Bootstraps the very first ADMIN account. Every other admin can only
 * be created/promoted through RegisterUserUseCase/ChangeUserRoleUseCase,
 * both of which require an existing admin as the requester (see
 * `ensureRequesterIsAdmin`) — without this seed there is no way to ever
 * create the first one. Idempotent: skips if the email already exists,
 * so re-running `seed:up` after the account was created is a no-op.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME || 'Admin';

    if (!email || !password) {
      throw new Error(
        'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to run this seeder.',
      );
    }

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM "users" WHERE email = :email',
      { replacements: { email } },
    );

    if (existing.length > 0) {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        name,
        email,
        password_hash: await bcrypt.hash(password, SALT_ROUNDS),
        role: 'ADMIN',
        active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL;

    if (!email) {
      return;
    }

    await queryInterface.bulkDelete('users', { email });
  },
};
