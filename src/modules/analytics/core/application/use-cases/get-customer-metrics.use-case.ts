import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  GetCustomerMetricsInputDto,
  GetCustomerMetricsOutputDto,
} from '../dtos/get-customer-metrics.dto';
import { toDateRange } from '../mappers/date-range.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { CustomerMetricsQuery } from '../ports/customer-metrics-query.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { UseCase } from '../../../../../shared/application/use-case';

const DEFAULT_TOP_LIMIT = 5;

export class GetCustomerMetricsUseCase implements UseCase<
  GetCustomerMetricsInputDto,
  GetCustomerMetricsOutputDto
> {
  constructor(
    private readonly customerMetricsQuery: CustomerMetricsQuery,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetCustomerMetricsInputDto,
  ): Promise<GetCustomerMetricsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const range = toDateRange(input.filter, this.clock);

    const [
      topCustomersByAppointments,
      activeCustomers,
      inactiveCustomers,
      lastAppointment,
    ] = await Promise.all([
      this.customerMetricsQuery.topCustomersByAppointments(
        range,
        DEFAULT_TOP_LIMIT,
      ),
      this.customerMetricsQuery.countActiveCustomers(range),
      this.customerMetricsQuery.countInactiveCustomers(range),
      input.customerId
        ? this.customerMetricsQuery.findLastAppointmentByCustomer(
            input.customerId,
          )
        : Promise.resolve(undefined),
    ]);

    return {
      metrics: {
        topCustomersByAppointments,
        activeCustomers,
        inactiveCustomers,
      },
      lastAppointment,
    };
  }
}
