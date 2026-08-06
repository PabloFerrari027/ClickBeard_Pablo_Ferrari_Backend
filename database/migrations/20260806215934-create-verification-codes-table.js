'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('verification_codes', {
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
      code_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      consumed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      invalidated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('verification_codes', ['user_id'], {
      name: 'verification_codes_user_id_idx',
    });
    await queryInterface.addIndex('verification_codes', ['expires_at'], {
      name: 'verification_codes_expires_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('verification_codes');
  },
};
