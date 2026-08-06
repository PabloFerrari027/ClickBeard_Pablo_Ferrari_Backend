import { Module } from '@nestjs/common';

import { APPOINTMENT_REPOSITORY } from './core/application/ports/appointment-repository.port';
import { AVAILABILITY_SERVICE } from './core/application/ports/availability-service.port';
import { BARBER_DIRECTORY } from './core/application/ports/barber-directory.port';
import { TRANSACTION_MANAGER } from './core/application/ports/transaction-manager.port';
import { CancelAppointmentUseCase } from './core/application/use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './core/application/use-cases/create-appointment.use-case';
import { GetAppointmentUseCase } from './core/application/use-cases/get-appointment.use-case';
import { ListAvailableTimeSlotsUseCase } from './core/application/use-cases/list-available-time-slots.use-case';
import { ListCustomerAppointmentsUseCase } from './core/application/use-cases/list-customer-appointments.use-case';
import { ListFutureAppointmentsUseCase } from './core/application/use-cases/list-future-appointments.use-case';
import { ListTodayAppointmentsUseCase } from './core/application/use-cases/list-today-appointments.use-case';
import { AppointmentsController } from './presentation/controllers/appointments.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { CacheInvalidatingUseCase } from '../../shared/application/cache/cache-invalidating-use-case';
import { CacheKeyGenerator } from '../../shared/application/cache/cache-key-generator';
import { CachedUseCase } from '../../shared/application/cache/cached-use-case';
import { CacheResource } from '../../shared/application/cache/cache-resource.enum';
import { CACHE_INVALIDATION_SERVICE } from '../../shared/application/ports/cache-invalidation-service.port';
import { CACHE_MANAGER } from '../../shared/application/ports/cache-manager.port';
import { CACHE_POLICY } from '../../shared/application/ports/cache-policy.port';
import { CLOCK } from '../../shared/application/ports/clock.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';

import type { AppointmentRepository } from './core/application/ports/appointment-repository.port';
import type { AvailabilityService } from './core/application/ports/availability-service.port';
import type { BarberDirectory } from './core/application/ports/barber-directory.port';
import type { TransactionManager } from './core/application/ports/transaction-manager.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { CacheInvalidationService } from '../../shared/application/ports/cache-invalidation-service.port';
import type { CacheManager } from '../../shared/application/ports/cache-manager.port';
import type { CachePolicy } from '../../shared/application/ports/cache-policy.port';
import type { Clock } from '../../shared/application/ports/clock.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  controllers: [AppointmentsController],
  providers: [
    {
      provide: CreateAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        availabilityService: AvailabilityService,
        userRepository: UserRepository,
        barberDirectory: BarberDirectory,
        transactionManager: TransactionManager,
        clock: Clock,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CreateAppointmentUseCase(
            appointmentRepository,
            availabilityService,
            userRepository,
            barberDirectory,
            transactionManager,
            clock,
            eventBus,
          ),
          cacheInvalidationService,
          {
            buildPrefixes: (_input, output) => [
              CacheKeyGenerator.barberTimeSlotsPrefix(
                output.appointment.barberId,
                output.appointment.startAt,
              ),
              CacheKeyGenerator.customerAppointmentsPrefix(
                output.appointment.customerId,
              ),
            ],
          },
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        AVAILABILITY_SERVICE,
        USER_REPOSITORY,
        BARBER_DIRECTORY,
        TRANSACTION_MANAGER,
        CLOCK,
        EVENT_BUS,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: CancelAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        clock: Clock,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CancelAppointmentUseCase(appointmentRepository, clock, eventBus),
          cacheInvalidationService,
          {
            buildPrefixes: (_input, output) => [
              CacheKeyGenerator.appointmentPrefix(output.appointment.id),
              CacheKeyGenerator.barberTimeSlotsPrefix(
                output.appointment.barberId,
                output.appointment.startAt,
              ),
              CacheKeyGenerator.customerAppointmentsPrefix(
                output.appointment.customerId,
              ),
            ],
          },
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        CLOCK,
        EVENT_BUS,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: GetAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new GetAppointmentUseCase(appointmentRepository, userRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.APPOINTMENT,
            // Scoped to the requester: this use case's own ownership/admin
            // check must still run for every distinct caller — see
            // CacheKeyGenerator.appointment.
            buildKey: (input) =>
              CacheKeyGenerator.appointment(
                input.appointmentId,
                input.requesterId,
              ),
          },
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        USER_REPOSITORY,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: ListCustomerAppointmentsUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListCustomerAppointmentsUseCase(appointmentRepository),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.CUSTOMER_APPOINTMENTS,
            // Mirrors ListCustomerAppointmentsUseCase's own DEFAULT_PAGE.
            buildKey: (input) =>
              CacheKeyGenerator.customerAppointments(
                input.customerId,
                input.page ?? 1,
              ),
          },
        ),
      inject: [APPOINTMENT_REPOSITORY, CACHE_MANAGER, CACHE_POLICY],
    },
    {
      provide: ListTodayAppointmentsUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        clock: Clock,
      ) =>
        new ListTodayAppointmentsUseCase(
          appointmentRepository,
          userRepository,
          clock,
        ),
      inject: [APPOINTMENT_REPOSITORY, USER_REPOSITORY, CLOCK],
    },
    {
      provide: ListFutureAppointmentsUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        clock: Clock,
      ) =>
        new ListFutureAppointmentsUseCase(
          appointmentRepository,
          userRepository,
          clock,
        ),
      inject: [APPOINTMENT_REPOSITORY, USER_REPOSITORY, CLOCK],
    },
    {
      provide: ListAvailableTimeSlotsUseCase,
      useFactory: (
        barberDirectory: BarberDirectory,
        availabilityService: AvailabilityService,
        clock: Clock,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListAvailableTimeSlotsUseCase(
            barberDirectory,
            availabilityService,
            clock,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.AVAILABLE_TIME_SLOTS,
            buildKey: (input) =>
              CacheKeyGenerator.availableTimeSlots(
                input.barberId,
                input.date,
                input.qualificationId,
              ),
          },
        ),
      inject: [
        BARBER_DIRECTORY,
        AVAILABILITY_SERVICE,
        CLOCK,
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
  ],
})
export class SchedulingModule {}
