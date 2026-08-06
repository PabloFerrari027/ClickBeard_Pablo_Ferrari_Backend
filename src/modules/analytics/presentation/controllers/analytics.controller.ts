import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../../auth/presentation/decorators/auth.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../../auth/presentation/types/authenticated-request-user';
import { FieldSelectionInterceptor } from '../../../../shared/presentation/interceptors/field-selection.interceptor';
import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { DateRangeFilterDto } from '../../core/application/dtos/date-range-filter.dto';
import { GetAppointmentMetricsUseCase } from '../../core/application/use-cases/get-appointment-metrics.use-case';
import { GetBarberMetricsUseCase } from '../../core/application/use-cases/get-barber-metrics.use-case';
import { GetCustomerMetricsUseCase } from '../../core/application/use-cases/get-customer-metrics.use-case';
import { GetDashboardMetricsUseCase } from '../../core/application/use-cases/get-dashboard-metrics.use-case';
import { GetOccupationMetricsUseCase } from '../../core/application/use-cases/get-occupation-metrics.use-case';
import { GetUserMetricsUseCase } from '../../core/application/use-cases/get-user-metrics.use-case';
import { AnalyticsFilterRequestDto } from '../dtos/analytics-filter.request.dto';
import { AppointmentMetricsResponseDto } from '../dtos/appointment-metrics.response.dto';
import { BarberMetricsResponseDto } from '../dtos/barber-metrics.response.dto';
import { CustomerMetricsResponseDto } from '../dtos/customer-metrics.response.dto';
import { DashboardMetricsResponseDto } from '../dtos/dashboard-metrics.response.dto';
import { GetCustomerMetricsRequestDto } from '../dtos/get-customer-metrics.request.dto';
import { OccupationMetricsResponseDto } from '../dtos/occupation-metrics.response.dto';
import { UserMetricsResponseDto } from '../dtos/user-metrics.response.dto';

function toFilter(query: AnalyticsFilterRequestDto): DateRangeFilterDto {
  return {
    preset: query.preset,
    startAt: query.startAt ? new Date(query.startAt) : undefined,
    endAt: query.endAt ? new Date(query.endAt) : undefined,
  };
}

@ApiTags('Analytics')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly getUserMetricsUseCase: GetUserMetricsUseCase,
    private readonly getAppointmentMetricsUseCase: GetAppointmentMetricsUseCase,
    private readonly getBarberMetricsUseCase: GetBarberMetricsUseCase,
    private readonly getCustomerMetricsUseCase: GetCustomerMetricsUseCase,
    private readonly getOccupationMetricsUseCase: GetOccupationMetricsUseCase,
  ) {}

  @Get('dashboard')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gets consolidated dashboard metrics for the admin panel',
  })
  @ApiOkResponse({ type: DashboardMetricsResponseDto })
  async getDashboard(
    @Query() query: AnalyticsFilterRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<DashboardMetricsResponseDto> {
    const { metrics } = await this.getDashboardMetricsUseCase.execute({
      requesterId: requester.id,
      filter: toFilter(query),
    });
    return metrics;
  }

  @Get('users')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gets user metrics (totals, roles, verification status)',
  })
  @ApiOkResponse({ type: UserMetricsResponseDto })
  async getUserMetrics(
    @Query() query: AnalyticsFilterRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<UserMetricsResponseDto> {
    const { metrics } = await this.getUserMetricsUseCase.execute({
      requesterId: requester.id,
      filter: toFilter(query),
    });
    return metrics;
  }

  @Get('appointments')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gets appointment metrics (volume, cancellations, usage patterns)',
  })
  @ApiOkResponse({ type: AppointmentMetricsResponseDto })
  async getAppointmentMetrics(
    @Query() query: AnalyticsFilterRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<AppointmentMetricsResponseDto> {
    const { metrics } = await this.getAppointmentMetricsUseCase.execute({
      requesterId: requester.id,
      filter: toFilter(query),
    });
    return metrics;
  }

  @Get('barbers')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gets barber metrics (appointments, demand, qualifications)',
  })
  @ApiOkResponse({ type: BarberMetricsResponseDto })
  async getBarberMetrics(
    @Query() query: AnalyticsFilterRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<BarberMetricsResponseDto> {
    const { metrics } = await this.getBarberMetricsUseCase.execute({
      requesterId: requester.id,
      filter: toFilter(query),
    });
    return metrics;
  }

  @Get('customers')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Gets customer metrics (top customers, active/inactive, last visit)',
  })
  @ApiOkResponse({ type: CustomerMetricsResponseDto })
  async getCustomerMetrics(
    @Query() query: GetCustomerMetricsRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<CustomerMetricsResponseDto> {
    const { metrics, lastAppointment } =
      await this.getCustomerMetricsUseCase.execute({
        requesterId: requester.id,
        filter: toFilter(query),
        customerId: query.customerId,
      });
    return { ...metrics, lastAppointment };
  }

  @Get('occupation')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gets barber occupancy and free time slot metrics',
  })
  @ApiOkResponse({ type: OccupationMetricsResponseDto })
  async getOccupationMetrics(
    @Query() query: AnalyticsFilterRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<OccupationMetricsResponseDto> {
    const { metrics } = await this.getOccupationMetricsUseCase.execute({
      requesterId: requester.id,
      filter: toFilter(query),
    });
    return metrics;
  }
}
