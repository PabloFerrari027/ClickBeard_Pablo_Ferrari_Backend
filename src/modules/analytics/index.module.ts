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
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { CLOCK } from '../../shared/application/ports/clock.port';

import type { AppointmentMetricsQuery } from './core/application/ports/appointment-metrics-query.port';
import type { BarberMetricsQuery } from './core/application/ports/barber-metrics-query.port';
import type { CustomerMetricsQuery } from './core/application/ports/customer-metrics-query.port';
import type { UserMetricsQuery } from './core/application/ports/user-metrics-query.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { Clock } from '../../shared/application/ports/clock.port';

@Module({
  providers: [
    {
      provide: GetUserMetricsUseCase,
      useFactory: (
        userMetricsQuery: UserMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
      ) => new GetUserMetricsUseCase(userMetricsQuery, userRepository, clock),
      inject: [USER_METRICS_QUERY, USER_REPOSITORY, CLOCK],
    },
    {
      provide: GetAppointmentMetricsUseCase,
      useFactory: (
        appointmentMetricsQuery: AppointmentMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
      ) =>
        new GetAppointmentMetricsUseCase(
          appointmentMetricsQuery,
          userRepository,
          clock,
        ),
      inject: [APPOINTMENT_METRICS_QUERY, USER_REPOSITORY, CLOCK],
    },
    {
      provide: GetBarberMetricsUseCase,
      useFactory: (
        barberMetricsQuery: BarberMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
      ) =>
        new GetBarberMetricsUseCase(barberMetricsQuery, userRepository, clock),
      inject: [BARBER_METRICS_QUERY, USER_REPOSITORY, CLOCK],
    },
    {
      provide: GetCustomerMetricsUseCase,
      useFactory: (
        customerMetricsQuery: CustomerMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
      ) =>
        new GetCustomerMetricsUseCase(
          customerMetricsQuery,
          userRepository,
          clock,
        ),
      inject: [CUSTOMER_METRICS_QUERY, USER_REPOSITORY, CLOCK],
    },
    {
      provide: GetOccupationMetricsUseCase,
      useFactory: (
        barberMetricsQuery: BarberMetricsQuery,
        userRepository: UserRepository,
        clock: Clock,
      ) =>
        new GetOccupationMetricsUseCase(
          barberMetricsQuery,
          userRepository,
          clock,
        ),
      inject: [BARBER_METRICS_QUERY, USER_REPOSITORY, CLOCK],
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
      ) =>
        new GetDashboardMetricsUseCase(
          userMetricsQuery,
          appointmentMetricsQuery,
          barberMetricsQuery,
          customerMetricsQuery,
          userRepository,
          clock,
        ),
      inject: [
        USER_METRICS_QUERY,
        APPOINTMENT_METRICS_QUERY,
        BARBER_METRICS_QUERY,
        CUSTOMER_METRICS_QUERY,
        USER_REPOSITORY,
        CLOCK,
      ],
    },
  ],
})
export class AnalyticsModule {}
