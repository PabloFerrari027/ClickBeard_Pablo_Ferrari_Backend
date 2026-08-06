import { Module } from '@nestjs/common';

import { APPOINTMENT_METRICS_QUERY } from './core/application/ports/appointment-metrics-query.port';
import { BARBER_METRICS_QUERY } from './core/application/ports/barber-metrics-query.port';
import { CUSTOMER_METRICS_QUERY } from './core/application/ports/customer-metrics-query.port';
import { USER_METRICS_QUERY } from './core/application/ports/user-metrics-query.port';
import { GetAppointmentMetricsUseCase } from './core/application/use-cases/get-appointment-metrics.use-case';
import { GetBarberMetricsUseCase } from './core/application/use-cases/get-barber-metrics.use-case';
import { GetCustomerMetricsUseCase } from './core/application/use-cases/get-customer-metrics.use-case';
import { GetDashboardMetricsUseCase } from './core/application/use-cases/get-dashboard-metrics.use-case';
import { GetOccupationMetricsUseCase } from './core/application/use-cases/get-occupation-metrics.use-case';
import { GetUserMetricsUseCase } from './core/application/use-cases/get-user-metrics.use-case';
import { AnalyticsController } from './presentation/controllers/analytics.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { CachedUseCase } from '../../shared/application/cache/cached-use-case';
import { CacheKeyGenerator } from '../../shared/application/cache/cache-key-generator';
import { CacheResource } from '../../shared/application/cache/cache-resource.enum';
import { CACHE_MANAGER } from '../../shared/application/ports/cache-manager.port';
import { CACHE_POLICY } from '../../shared/application/ports/cache-policy.port';
import { CLOCK } from '../../shared/application/ports/clock.port';

import type { DateRangeFilterDto } from './core/application/dtos/date-range-filter.dto';
import type { AppointmentMetricsQuery } from './core/application/ports/appointment-metrics-query.port';
import type { BarberMetricsQuery } from './core/application/ports/barber-metrics-query.port';
import type { CustomerMetricsQuery } from './core/application/ports/customer-metrics-query.port';
import type { UserMetricsQuery } from './core/application/ports/user-metrics-query.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { CacheManager } from '../../shared/application/ports/cache-manager.port';
import type { CachePolicy } from '../../shared/application/ports/cache-policy.port';
import type { Clock } from '../../shared/application/ports/clock.port';

/**
 * Every Analytics read is cached by period alone, never by requesterId:
 * the data is identical for any caller who passes the ADMIN gate, and
 * that gate is enforced by AnalyticsController's `@Auth(UserRole.ADMIN)`
 * before a request ever reaches these cached use cases. The use cases'
 * own `ensureRequesterIsAdmin` check still runs in full on every cache
 * miss and for any direct, uncached invocation.
 */
function periodOf(filter: DateRangeFilterDto): string {
  return CacheKeyGenerator.periodKey(
    filter.preset,
    filter.startAt,
    filter.endAt,
  );
}

@Module({
  controllers: [AnalyticsController],
  providers: [
    {
      provide: GetUserMetricsUseCase,
      useFactory: (
        userMetricsQuery: UserMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetUserMetricsUseCase(userMetricsQuery, userRepository, clock),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.USER_METRICS,
            buildKey: (input) =>
              CacheKeyGenerator.metrics('users', periodOf(input.filter)),
          },
        ),
      inject: [
        USER_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: GetAppointmentMetricsUseCase,
      useFactory: (
        appointmentMetricsQuery: AppointmentMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetAppointmentMetricsUseCase(
            appointmentMetricsQuery,
            userRepository,
            clock,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.APPOINTMENT_METRICS,
            buildKey: (input) =>
              CacheKeyGenerator.metrics('appointments', periodOf(input.filter)),
          },
        ),
      inject: [
        APPOINTMENT_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: GetBarberMetricsUseCase,
      useFactory: (
        barberMetricsQuery: BarberMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetBarberMetricsUseCase(
            barberMetricsQuery,
            userRepository,
            clock,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.BARBER_METRICS,
            buildKey: (input) =>
              CacheKeyGenerator.metrics('barbers', periodOf(input.filter)),
          },
        ),
      inject: [
        BARBER_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: GetCustomerMetricsUseCase,
      useFactory: (
        customerMetricsQuery: CustomerMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetCustomerMetricsUseCase(
            customerMetricsQuery,
            userRepository,
            clock,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.CUSTOMER_METRICS,
            buildKey: (input) =>
              CacheKeyGenerator.customerMetrics(
                periodOf(input.filter),
                input.customerId,
              ),
          },
        ),
      inject: [
        CUSTOMER_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: GetOccupationMetricsUseCase,
      useFactory: (
        barberMetricsQuery: BarberMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetOccupationMetricsUseCase(
            barberMetricsQuery,
            userRepository,
            clock,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.OCCUPATION_METRICS,
            buildKey: (input) =>
              CacheKeyGenerator.metrics('occupation', periodOf(input.filter)),
          },
        ),
      inject: [
        BARBER_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: GetDashboardMetricsUseCase,
      useFactory: (
        userMetricsQuery: UserMetricsQuery,
        appointmentMetricsQuery: AppointmentMetricsQuery,
        barberMetricsQuery: BarberMetricsQuery,
        customerMetricsQuery: CustomerMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetDashboardMetricsUseCase(
            userMetricsQuery,
            appointmentMetricsQuery,
            barberMetricsQuery,
            customerMetricsQuery,
            userRepository,
            clock,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.DASHBOARD_METRICS,
            buildKey: (input) =>
              CacheKeyGenerator.dashboardMetrics(periodOf(input.filter)),
          },
        ),
      inject: [
        USER_METRICS_QUERY,
        APPOINTMENT_METRICS_QUERY,
        BARBER_METRICS_QUERY,
        CUSTOMER_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
  ],
})
export class AnalyticsModule {}
