'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qualifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Column-level `unique` inside createTable() is unreliable across
    // Sequelize dialects — an explicit index is the only way that's
    // guaranteed to actually create the constraint.
    await queryInterface.addIndex('qualifications', ['name'], {
      name: 'qualifications_name_unique',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('qualifications');
  },
};
