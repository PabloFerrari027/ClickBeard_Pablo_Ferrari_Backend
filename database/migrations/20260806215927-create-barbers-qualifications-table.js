'use strict';

/**
 * Join table for `Barber.qualificationIds`. A composite primary key
 * doubles as the "no duplicate qualification for the same barber"
 * constraint, so no separate unique index is needed.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('barbers_qualifications', {
      barber_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'barbers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      qualification_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'qualifications', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('barbers_qualifications', [
      'qualification_id',
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('barbers_qualifications');
  },
};
