import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  GetBarberMetricsInputDto,
  GetBarberMetricsOutputDto,
} from '../dtos/get-barber-metrics.dto';
import { toDateRange } from '../mappers/date-range.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberMetricsQuery } from '../ports/barber-metrics-query.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { UseCase } from '../../../../../shared/application/use-case';

const DEFAULT_TOP_LIMIT = 5;

export class GetBarberMetricsUseCase implements UseCase<
  GetBarberMetricsInputDto,
  GetBarberMetricsOutputDto
> {
  constructor(
    private readonly barberMetricsQuery: BarberMetricsQuery,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetBarberMetricsInputDto,
  ): Promise<GetBarberMetricsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const range = toDateRange(input.filter, this.clock);

    const [
      totalBarbers,
      appointmentsByBarber,
      mostRequestedBarbers,
      mostUsedQualifications,
    ] = await Promise.all([
      this.barberMetricsQuery.countTotal(),
      this.barberMetricsQuery.countAppointmentsByBarber(range),
      this.barberMetricsQuery.mostRequestedBarbers(range, DEFAULT_TOP_LIMIT),
      this.barberMetricsQuery.mostUsedQualifications(range, DEFAULT_TOP_LIMIT),
    ]);

    return {
      metrics: {
        totalBarbers,
        appointmentsByBarber,
        mostRequestedBarbers,
        mostUsedQualifications,
      },
    };
  }
}
