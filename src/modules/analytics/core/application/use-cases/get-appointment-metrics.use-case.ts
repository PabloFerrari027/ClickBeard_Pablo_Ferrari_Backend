import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  GetAppointmentMetricsInputDto,
  GetAppointmentMetricsOutputDto,
} from '../dtos/get-appointment-metrics.dto';
import { toDateRange } from '../mappers/date-range.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentMetricsQuery } from '../ports/appointment-metrics-query.port';
import { UseCase } from '../../../../../shared/application/use-case';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { DateRange } from '../../domain/value-objects/date-range.value-object';

const DEFAULT_TOP_LIMIT = 5;

export class GetAppointmentMetricsUseCase implements UseCase<
  GetAppointmentMetricsInputDto,
  GetAppointmentMetricsOutputDto
> {
  constructor(
    private readonly appointmentMetricsQuery: AppointmentMetricsQuery,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GetAppointmentMetricsInputDto,
  ): Promise<GetAppointmentMetricsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const now = new Date();
    const range = toDateRange(input.filter, now);
    const todayRange = DateRange.fromPreset(PeriodPreset.TODAY, now);
    const weekRange = DateRange.fromPreset(PeriodPreset.WEEK, now);
    const monthRange = DateRange.fromPreset(PeriodPreset.MONTH, now);

    const [
      totalAppointments,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      appointmentsInPeriod,
      futureAppointments,
      cancelledAppointments,
      cancellationRate,
      mostUsedTimeSlots,
      busiestDaysOfWeek,
    ] = await Promise.all([
      this.appointmentMetricsQuery.countTotal(),
      this.appointmentMetricsQuery.countInRange(todayRange),
      this.appointmentMetricsQuery.countInRange(weekRange),
      this.appointmentMetricsQuery.countInRange(monthRange),
      this.appointmentMetricsQuery.countInRange(range),
      this.appointmentMetricsQuery.countUpcoming(now),
      this.appointmentMetricsQuery.countCancelled(range),
      this.appointmentMetricsQuery.cancellationRate(range),
      this.appointmentMetricsQuery.mostUsedTimeSlots(range, DEFAULT_TOP_LIMIT),
      this.appointmentMetricsQuery.busiestDaysOfWeek(range, DEFAULT_TOP_LIMIT),
    ]);

    return {
      metrics: {
        totalAppointments,
        appointmentsToday,
        appointmentsThisWeek,
        appointmentsThisMonth,
        appointmentsInPeriod,
        futureAppointments,
        cancelledAppointments,
        cancellationRate,
        mostUsedTimeSlots,
        busiestDaysOfWeek,
      },
    };
  }
}
