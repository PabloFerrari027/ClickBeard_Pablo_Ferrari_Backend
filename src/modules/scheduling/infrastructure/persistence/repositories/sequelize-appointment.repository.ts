import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Appointment } from '../../../core/domain/entities/appointment.entity';
import { BarberTimeSlotConflictError } from '../../../core/domain/errors/barber-time-slot-conflict.error';
import { AppointmentStatus } from '../../../core/domain/enums/appointment-status.enum';
import {
  AppointmentRepository,
  PaginatedAppointments,
} from '../../../core/application/ports/appointment-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { isUniqueConstraintError } from '../../../../../shared/database/sequelize-error.helpers';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import { getDayRange } from '../day-range';
import {
  toAppointmentDomain,
  toAppointmentPersistence,
} from '../mappers/appointment.mapper';
import { AppointmentModel } from '../models/appointment.model';

/** Name of the partial unique index created in `create-appointments-table`. */
const BARBER_TIME_SLOT_UNIQUE_INDEX =
  'appointments_barber_id_start_at_active_unique';

@Injectable()
export class SequelizeAppointmentRepository implements AppointmentRepository {
  constructor(
    @InjectModel(AppointmentModel)
    private readonly appointmentModel: typeof AppointmentModel,
  ) {}

  async save(appointment: Appointment): Promise<void> {
    try {
      await this.appointmentModel.upsert(
        toAppointmentPersistence(appointment),
        { transaction: TransactionContext.current() },
      );
    } catch (error) {
      if (isUniqueConstraintError(error, BARBER_TIME_SLOT_UNIQUE_INDEX)) {
        throw new BarberTimeSlotConflictError();
      }

      throw mapToPersistenceError(error);
    }
  }

  async findById(id: string): Promise<Appointment | null> {
    try {
      const model = await this.appointmentModel.findByPk(id, {
        transaction: TransactionContext.current(),
      });

      return model ? toAppointmentDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findByCustomerId(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments> {
    return this.findPaginated({ customerId }, page, limit);
  }

  async findByBarberId(
    barberId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments> {
    return this.findPaginated({ barberId }, page, limit);
  }

  async findByDate(
    date: Date,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments> {
    const { start, end } = getDayRange(date);

    return this.findPaginated(
      { startAt: { [Op.gte]: start, [Op.lt]: end } },
      page,
      limit,
    );
  }

  async findUpcoming(
    from: Date,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments> {
    return this.findPaginated({ startAt: { [Op.gte]: from } }, page, limit);
  }

  async findScheduledByBarberAndRange(
    barberId: string,
    start: Date,
    end: Date,
  ): Promise<Appointment[]> {
    try {
      const models = await this.appointmentModel.findAll({
        where: {
          barberId,
          status: AppointmentStatus.SCHEDULED,
          startAt: { [Op.gte]: start, [Op.lt]: end },
        },
        order: [['startAt', 'ASC']],
        transaction: TransactionContext.current(),
      });

      return models.map(toAppointmentDomain);
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  private async findPaginated(
    where: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<PaginatedAppointments> {
    try {
      const { rows, count } = await this.appointmentModel.findAndCountAll({
        where,
        order: [['startAt', 'ASC']],
        limit,
        offset: (page - 1) * limit,
        transaction: TransactionContext.current(),
      });

      return { appointments: rows.map(toAppointmentDomain), total: count };
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
