import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  GetUserMetricsInputDto,
  GetUserMetricsOutputDto,
} from '../dtos/get-user-metrics.dto';
import { toDateRange } from '../mappers/date-range.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { UserMetricsQuery } from '../ports/user-metrics-query.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class GetUserMetricsUseCase implements UseCase<
  GetUserMetricsInputDto,
  GetUserMetricsOutputDto
> {
  constructor(
    private readonly userMetricsQuery: UserMetricsQuery,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetUserMetricsInputDto,
  ): Promise<GetUserMetricsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const range = toDateRange(input.filter, this.clock);

    const [
      totalUsers,
      totalByRole,
      activeUsers,
      inactiveUsers,
      newUsersInPeriod,
      pendingVerification,
      verifiedAccounts,
    ] = await Promise.all([
      this.userMetricsQuery.countTotal(),
      this.userMetricsQuery.countByRole(),
      this.userMetricsQuery.countActive(),
      this.userMetricsQuery.countInactive(),
      this.userMetricsQuery.countRegisteredInRange(range),
      this.userMetricsQuery.countPendingVerification(),
      this.userMetricsQuery.countVerified(),
    ]);

    return {
      metrics: {
        totalUsers,
        totalByRole,
        activeUsers,
        inactiveUsers,
        newUsersInPeriod,
        pendingVerification,
        verifiedAccounts,
      },
    };
  }
}
