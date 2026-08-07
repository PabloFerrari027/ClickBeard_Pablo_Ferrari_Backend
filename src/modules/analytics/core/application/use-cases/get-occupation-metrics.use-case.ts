import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  GetOccupationMetricsInputDto,
  GetOccupationMetricsOutputDto,
} from '../dtos/get-occupation-metrics.dto';
import { toDateRange } from '../mappers/date-range.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberMetricsQuery } from '../ports/barber-metrics-query.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class GetOccupationMetricsUseCase implements UseCase<
  GetOccupationMetricsInputDto,
  GetOccupationMetricsOutputDto
> {
  constructor(
    private readonly barberMetricsQuery: BarberMetricsQuery,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GetOccupationMetricsInputDto,
  ): Promise<GetOccupationMetricsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const range = toDateRange(input.filter, new Date());

    const occupancyByBarber =
      await this.barberMetricsQuery.occupancyByBarber(range);

    const averageOccupancyRate =
      occupancyByBarber.length === 0
        ? 0
        : occupancyByBarber.reduce(
            (sum, barber) => sum + barber.occupancyRate,
            0,
          ) / occupancyByBarber.length;

    return {
      metrics: {
        occupancyByBarber,
        averageOccupancyRate,
      },
    };
  }
}
