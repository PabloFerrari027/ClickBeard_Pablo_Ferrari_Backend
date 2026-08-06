import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { AppointmentStatus } from '../../../core/domain/enums/appointment-status.enum';
import { TimeSlot } from '../../../core/domain/value-objects/time-slot.value-object';
import { AvailabilityService } from '../../../core/application/ports/availability-service.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import { getDayRange } from '../day-range';
import { AppointmentModel } from '../models/appointment.model';

@Injectable()
export class SequelizeAvailabilityService implements AvailabilityService {
  constructor(
    @InjectModel(AppointmentModel)
    private readonly appointmentModel: typeof AppointmentModel,
  ) {}

  async isBarberAvailable(
    barberId: string,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    try {
      const count = await this.appointmentModel.count({
        where: {
          barberId,
          startAt: timeSlot.getStart(),
          status: AppointmentStatus.SCHEDULED,
        },
        transaction: TransactionContext.current(),
      });

      return count === 0;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async getBookedSlots(barberId: string, date: Date): Promise<TimeSlot[]> {
    try {
      const { start, end } = getDayRange(date);
      const models = await this.appointmentModel.findAll({
        where: {
          barberId,
          status: AppointmentStatus.SCHEDULED,
          startAt: { [Op.gte]: start, [Op.lt]: end },
        },
        transaction: TransactionContext.current(),
      });

      return models.map((model) => TimeSlot.create(model.startAt));
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
