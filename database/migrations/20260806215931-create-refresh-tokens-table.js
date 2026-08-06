'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      token_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      replaced_by_token_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'refresh_tokens', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('refresh_tokens', ['user_id'], {
      name: 'refresh_tokens_user_id_idx',
    });

    // Column-level `unique` inside createTable() is unreliable across
    // Sequelize dialects — an explicit index is the only way that's
    // guaranteed to actually create the constraint.
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], {
      name: 'refresh_tokens_token_hash_unique',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
