'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'appointments',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          customer_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          barber_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'barbers', key: 'id' },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          qualification_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'qualifications', key: 'id' },
            onDelete: 'RESTRICT',
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
          status: {
            type: Sequelize.ENUM('SCHEDULED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'SCHEDULED',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          cancelled_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('appointments', ['customer_id'], {
        name: 'appointments_customer_id_idx',
        transaction,
      });

      await queryInterface.addIndex('appointments', ['start_at'], {
        name: 'appointments_start_at_idx',
        transaction,
      });

      // The actual guarantee against double-booking: only one
      // non-cancelled appointment per (barber, slot). A cancelled slot
      // frees itself up for rebooking, so the index is partial.
      await queryInterface.addIndex('appointments', ['barber_id', 'start_at'], {
        name: 'appointments_barber_id_start_at_active_unique',
        unique: true,
        where: { status: 'SCHEDULED' },
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('appointments', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_appointments_status";',
        { transaction },
      );
    });
  },
};
