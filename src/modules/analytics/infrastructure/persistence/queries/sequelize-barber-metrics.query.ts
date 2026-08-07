import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  BarberAppointmentCount,
  BarberMetricsQuery,
  BarberOccupation,
  QualificationUsageCount,
} from '../../../core/application/ports/barber-metrics-query.port';
import { DateRange } from '../../../core/domain/value-objects/date-range.value-object';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import { MS_PER_DAY } from '../../../../../shared/utils/time.constants';
import { toTimeSlotDto } from '../../../../scheduling/core/application/mappers/time-slot.mapper';
import {
  APPOINTMENT_DURATION_MINUTES,
  CLOSING_HOUR,
  OPENING_HOUR,
  TimeSlot,
} from '../../../../scheduling/core/domain/value-objects/time-slot.value-object';

const SLOTS_PER_DAY =
  ((CLOSING_HOUR - OPENING_HOUR) * 60) / APPOINTMENT_DURATION_MINUTES;

interface BarberAppointmentCountRow {
  barberId: string;
  barberName: string;
  total: number;
}

/**
 * Reads Barber's and Scheduling's tables by their literal names — the
 * same cross-module read pattern `SequelizeBarberDirectoryService` uses
 * — and reuses Scheduling's `TimeSlot`/business-hours constants purely
 * as read-only Core value objects to keep `occupancyByBarber`'s notion
 * of a "slot" identical to the one customers actually book against.
 */
@Injectable()
export class SequelizeBarberMetricsQuery implements BarberMetricsQuery {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async countTotal(): Promise<number> {
    try {
      const rows = await this.sequelize.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM "barbers"',
        { type: QueryTypes.SELECT, transaction: TransactionContext.current() },
      );

      return rows[0]?.total ?? 0;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async countAppointmentsByBarber(
    range: DateRange,
  ): Promise<BarberAppointmentCount[]> {
    return this.appointmentCountsByBarber(range);
  }

  async mostRequestedBarbers(
    range: DateRange,
    limit: number,
  ): Promise<BarberAppointmentCount[]> {
    return this.appointmentCountsByBarber(range, limit);
  }

  async mostUsedQualifications(
    range: DateRange,
    limit: number,
  ): Promise<QualificationUsageCount[]> {
    try {
      return await this.sequelize.query<QualificationUsageCount>(
        `SELECT q.id AS "qualificationId", q.name AS "qualificationName", COUNT(a.id)::int AS "total"
         FROM "qualifications" q
         INNER JOIN "appointments" a
           ON a.qualification_id = q.id
          AND a.status = 'SCHEDULED'
          AND a.start_at BETWEEN :start AND :end
         GROUP BY q.id, q.name
         ORDER BY "total" DESC
         LIMIT :limit`,
        {
          replacements: {
            start: range.getStart(),
            end: range.getEnd(),
            limit,
          },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async occupancyByBarber(range: DateRange): Promise<BarberOccupation[]> {
    try {
      const bookedByBarber = await this.appointmentCountsByBarber(range);
      const availableSlots = this.countCalendarDays(range) * SLOTS_PER_DAY;
      const today = new Date();
      const freeSlotsByBarber = await this.freeTimeSlotsByBarber(
        bookedByBarber.map((barber) => barber.barberId),
        today,
      );

      return bookedByBarber.map((barber) => ({
        barberId: barber.barberId,
        barberName: barber.barberName,
        bookedSlots: barber.total,
        availableSlots,
        occupancyRate: availableSlots === 0 ? 0 : barber.total / availableSlots,
        freeTimeSlots: freeSlotsByBarber.get(barber.barberId) ?? [],
      }));
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  private async appointmentCountsByBarber(
    range: DateRange,
    limit?: number,
  ): Promise<BarberAppointmentCount[]> {
    try {
      return await this.sequelize.query<BarberAppointmentCountRow>(
        `SELECT b.id AS "barberId", b.name AS "barberName", COUNT(a.id)::int AS "total"
         FROM "barbers" b
         LEFT JOIN "appointments" a
           ON a.barber_id = b.id
          AND a.status = 'SCHEDULED'
          AND a.start_at BETWEEN :start AND :end
         GROUP BY b.id, b.name
         ORDER BY "total" DESC, b.name
         ${limit ? 'LIMIT :limit' : ''}`,
        {
          replacements: { start: range.getStart(), end: range.getEnd(), limit },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  /**
   * `freeTimeSlots` is a "right now" snapshot (today's still-open
   * slots), not scoped to the requested `range` — the range only shapes
   * `bookedSlots`/`availableSlots`/`occupancyRate`, mirroring how
   * `ListAvailableTimeSlotsUseCase` computes availability for a single
   * day, the only "free slots" concept this codebase already defines.
   */
  private async freeTimeSlotsByBarber(
    barberIds: string[],
    today: Date,
  ): Promise<Map<string, ReturnType<typeof toTimeSlotDto>[]>> {
    const result = new Map<string, ReturnType<typeof toTimeSlotDto>[]>();

    if (barberIds.length === 0) {
      return result;
    }

    const dayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

    const bookedRows = await this.sequelize.query<{
      barberId: string;
      startAt: Date;
    }>(
      `SELECT barber_id AS "barberId", start_at AS "startAt"
       FROM "appointments"
       WHERE status = 'SCHEDULED' AND start_at >= :dayStart AND start_at < :dayEnd`,
      {
        replacements: { dayStart, dayEnd },
        type: QueryTypes.SELECT,
        transaction: TransactionContext.current(),
      },
    );

    const bookedStartsByBarber = new Map<string, Set<number>>();

    for (const row of bookedRows) {
      const starts =
        bookedStartsByBarber.get(row.barberId) ?? new Set<number>();

      starts.add(new Date(row.startAt).getTime());
      bookedStartsByBarber.set(row.barberId, starts);
    }

    const allSlots = TimeSlot.allForDate(today);
    const nowMs = today.getTime();

    for (const barberId of barberIds) {
      const bookedStarts =
        bookedStartsByBarber.get(barberId) ?? new Set<number>();
      const free = allSlots
        .filter(
          (slot) =>
            slot.getStart().getTime() >= nowMs &&
            !bookedStarts.has(slot.getStart().getTime()),
        )
        .map(toTimeSlotDto);

      result.set(barberId, free);
    }

    return result;
  }

  private countCalendarDays(range: DateRange): number {
    const start = range.getStart();
    const end = range.getEnd();
    const startDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    return Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1;
  }
}
