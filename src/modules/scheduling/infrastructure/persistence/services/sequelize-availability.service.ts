import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { AppointmentStatus } from '../../../core/domain/enums/appointment-status.enum';
import { TimeSlot } from '../../../core/domain/value-objects/time-slot.value-object';
import { AvailabilityService } from '../../../core/application/ports/availability-service.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import { getDayRange } from '../day-range';
import { AppointmentModel } from '../models/appointment.model';

interface UnavailabilityPeriodRow {
  startAt: Date;
  endAt: Date;
}

@Injectable()
export class SequelizeAvailabilityService implements AvailabilityService {
  constructor(
    @InjectModel(AppointmentModel)
    private readonly appointmentModel: typeof AppointmentModel,
    @InjectConnection() private readonly sequelize: Sequelize,
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

      return models.map((model) =>
        TimeSlot.restore(model.startAt, model.endAt),
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async isBarberUnavailable(
    barberId: string,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    try {
      const rows = await this.sequelize.query<{ exists: boolean }>(
        `SELECT EXISTS(
           SELECT 1 FROM "barbers_unavailabilities"
           WHERE barber_id = :barberId
             AND start_at <= :slotStart
             AND end_at > :slotStart
         ) AS "exists"`,
        {
          replacements: {
            barberId,
            slotStart: timeSlot.getStart(),
          },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );

      return rows[0]?.exists ?? false;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async getUnavailableSlots(barberId: string, date: Date): Promise<TimeSlot[]> {
    try {
      const { start, end } = getDayRange(date);
      const periods = await this.sequelize.query<UnavailabilityPeriodRow>(
        `SELECT start_at AS "startAt", end_at AS "endAt"
         FROM "barbers_unavailabilities"
         WHERE barber_id = :barberId
           AND start_at < :dayEnd
           AND end_at > :dayStart`,
        {
          replacements: { barberId, dayStart: start, dayEnd: end },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );

      return TimeSlot.allForDate(date).filter((slot) =>
        periods.some(
          (period) =>
            slot.getStart().getTime() >= period.startAt.getTime() &&
            slot.getStart().getTime() < period.endAt.getTime(),
        ),
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
