import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  GetDashboardMetricsInputDto,
  GetDashboardMetricsOutputDto,
} from '../dtos/get-dashboard-metrics.dto';
import { toDateRange } from '../mappers/date-range.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentMetricsQuery } from '../ports/appointment-metrics-query.port';
import { BarberMetricsQuery } from '../ports/barber-metrics-query.port';
import { CustomerMetricsQuery } from '../ports/customer-metrics-query.port';
import { UserMetricsQuery } from '../ports/user-metrics-query.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { UseCase } from '../../../../../shared/application/use-case';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { DateRange } from '../../domain/value-objects/date-range.value-object';

const DEFAULT_TOP_LIMIT = 5;

/**
 * The "give me everything" composite query behind the admin dashboard.
 * It talks to the same ports as the individual Get*Metrics use cases
 * rather than calling them directly, matching the rest of this codebase
 * where use cases only ever depend on ports, never on other use cases.
 */
export class GetDashboardMetricsUseCase implements UseCase<
  GetDashboardMetricsInputDto,
  GetDashboardMetricsOutputDto
> {
  constructor(
    private readonly userMetricsQuery: UserMetricsQuery,
    private readonly appointmentMetricsQuery: AppointmentMetricsQuery,
    private readonly barberMetricsQuery: BarberMetricsQuery,
    private readonly customerMetricsQuery: CustomerMetricsQuery,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetDashboardMetricsInputDto,
  ): Promise<GetDashboardMetricsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const now = this.clock.now();
    const range = toDateRange(input.filter, this.clock);
    const todayRange = DateRange.fromPreset(PeriodPreset.TODAY, now);
    const weekRange = DateRange.fromPreset(PeriodPreset.WEEK, now);
    const monthRange = DateRange.fromPreset(PeriodPreset.MONTH, now);

    const [
      totalUsers,
      totalByRole,
      activeUsers,
      inactiveUsers,
      newUsersInPeriod,
      pendingVerification,
      verifiedAccounts,
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
      totalBarbers,
      appointmentsByBarber,
      mostRequestedBarbers,
      mostUsedQualifications,
      occupancyByBarber,
      topCustomersByAppointments,
      activeCustomers,
      inactiveCustomers,
    ] = await Promise.all([
      this.userMetricsQuery.countTotal(),
      this.userMetricsQuery.countByRole(),
      this.userMetricsQuery.countActive(),
      this.userMetricsQuery.countInactive(),
      this.userMetricsQuery.countRegisteredInRange(range),
      this.userMetricsQuery.countPendingVerification(),
      this.userMetricsQuery.countVerified(),
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
      this.barberMetricsQuery.countTotal(),
      this.barberMetricsQuery.countAppointmentsByBarber(range),
      this.barberMetricsQuery.mostRequestedBarbers(range, DEFAULT_TOP_LIMIT),
      this.barberMetricsQuery.mostUsedQualifications(range, DEFAULT_TOP_LIMIT),
      this.barberMetricsQuery.occupancyByBarber(range),
      this.customerMetricsQuery.topCustomersByAppointments(
        range,
        DEFAULT_TOP_LIMIT,
      ),
      this.customerMetricsQuery.countActiveCustomers(range),
      this.customerMetricsQuery.countInactiveCustomers(range),
    ]);

    const averageOccupancyRate =
      occupancyByBarber.length === 0
        ? 0
        : occupancyByBarber.reduce(
            (sum, barber) => sum + barber.occupancyRate,
            0,
          ) / occupancyByBarber.length;

    return {
      metrics: {
        users: {
          totalUsers,
          totalByRole,
          activeUsers,
          inactiveUsers,
          newUsersInPeriod,
          pendingVerification,
          verifiedAccounts,
        },
        appointments: {
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
        barbers: {
          totalBarbers,
          appointmentsByBarber,
          mostRequestedBarbers,
          mostUsedQualifications,
        },
        customers: {
          topCustomersByAppointments,
          activeCustomers,
          inactiveCustomers,
        },
        occupation: {
          occupancyByBarber,
          averageOccupancyRate,
        },
      },
    };
  }
}
