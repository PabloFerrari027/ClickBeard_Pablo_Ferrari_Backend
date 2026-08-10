'use strict';

/**
 * Backs the deactivate-on-demotion/reactivate-on-promotion flow: a
 * Barber row is never deleted when its user leaves the BARBER role, it's
 * just flipped inactive so it drops out of search/booking while staying
 * around to be reactivated later with its original data intact.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('barbers', 'active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('barbers', 'active');
  },
};
