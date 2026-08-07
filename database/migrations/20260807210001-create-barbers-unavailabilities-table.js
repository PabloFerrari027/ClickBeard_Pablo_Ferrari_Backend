'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'barbers_unavailabilities',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          barber_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'barbers', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          start_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          end_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          reason: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('barbers_unavailabilities', ['barber_id'], {
        name: 'barbers_unavailabilities_barber_id_idx',
        transaction,
      });

      await queryInterface.addIndex('barbers_unavailabilities', ['start_at'], {
        name: 'barbers_unavailabilities_start_at_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('barbers_unavailabilities');
  },
};
