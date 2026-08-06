'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'users',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          email: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          password_hash: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          role: {
            type: Sequelize.ENUM('CLIENT', 'BARBER', 'ADMIN'),
            allowNull: false,
            defaultValue: 'CLIENT',
          },
          active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('users', ['role'], {
        name: 'users_role_idx',
        transaction,
      });

      // Column-level `unique` inside createTable() is unreliable across
      // Sequelize dialects — an explicit index is the only way that's
      // guaranteed to actually create the constraint.
      await queryInterface.addIndex('users', ['email'], {
        name: 'users_email_unique',
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('users', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_users_role";',
        { transaction },
      );
    });
  },
};
