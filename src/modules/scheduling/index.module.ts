import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { APPOINTMENT_REPOSITORY } from './core/application/ports/appointment-repository.port';
import { AVAILABILITY_SERVICE } from './core/application/ports/availability-service.port';
import { BARBER_DIRECTORY } from './core/application/ports/barber-directory.port';
import { TRANSACTION_MANAGER } from './core/application/ports/transaction-manager.port';
import { CancelAppointmentByAdminUseCase } from './core/application/use-cases/cancel-appointment-by-admin.use-case';
import { CancelAppointmentUseCase } from './core/application/use-cases/cancel-appointment.use-case';
import { CancelAppointmentsForBarberUnavailabilityUseCase } from './core/application/use-cases/cancel-appointments-for-barber-unavailability.use-case';
import { CreateAppointmentUseCase } from './core/application/use-cases/create-appointment.use-case';
import { GetAppointmentUseCase } from './core/application/use-cases/get-appointment.use-case';
import { ListAvailableTimeSlotsUseCase } from './core/application/use-cases/list-available-time-slots.use-case';
import { ListCustomerAppointmentsUseCase } from './core/application/use-cases/list-customer-appointments.use-case';
import { ListFutureAppointmentsUseCase } from './core/application/use-cases/list-future-appointments.use-case';
import { ListTodayAppointmentsUseCase } from './core/application/use-cases/list-today-appointments.use-case';
import { BarberUnavailabilityCreatedConsumer } from './infrastructure/messaging/barber-unavailability-created.consumer';
import { AppointmentModel } from './infrastructure/persistence/models/appointment.model';
import { SequelizeAppointmentRepository } from './infrastructure/persistence/repositories/sequelize-appointment.repository';
import { SequelizeAvailabilityService } from './infrastructure/persistence/services/sequelize-availability.service';
import { SequelizeBarberDirectoryService } from './infrastructure/persistence/services/sequelize-barber-directory.service';
import { SequelizeTransactionManager } from './infrastructure/persistence/services/sequelize-transaction-manager';
import { AppointmentsController } from './presentation/controllers/appointments.controller';
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { IdentityModule } from '../identity/index.module';
import { AuthModule } from '../auth/index.module';
import { CacheInvalidatingUseCase } from '../../shared/application/cache/cache-invalidating-use-case';
import { CacheKeyGenerator } from '../../shared/application/cache/cache-key-generator';
import { CachedUseCase } from '../../shared/application/cache/cached-use-case';
import { CacheResource } from '../../shared/application/cache/cache-resource.enum';
import { CACHE_INVALIDATION_SERVICE } from '../../shared/application/ports/cache-invalidation-service.port';
import { CACHE_MANAGER } from '../../shared/application/ports/cache-manager.port';
import { CACHE_POLICY } from '../../shared/application/ports/cache-policy.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';

import type { AppointmentRepository } from './core/application/ports/appointment-repository.port';
import type { AvailabilityService } from './core/application/ports/availability-service.port';
import type { BarberDirectory } from './core/application/ports/barber-directory.port';
import type { TransactionManager } from './core/application/ports/transaction-manager.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { CacheInvalidationService } from '../../shared/application/ports/cache-invalidation-service.port';
import type { CacheManager } from '../../shared/application/ports/cache-manager.port';
import type { CachePolicy } from '../../shared/application/ports/cache-policy.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
  imports: [
    IdentityModule,
    AuthModule,
    SequelizeModule.forFeature([AppointmentModel]),
  ],
  controllers: [AppointmentsController],
  providers: [
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: SequelizeAppointmentRepository,
    },
    { provide: TRANSACTION_MANAGER, useClass: SequelizeTransactionManager },
    { provide: AVAILABILITY_SERVICE, useClass: SequelizeAvailabilityService },
    { provide: BARBER_DIRECTORY, useClass: SequelizeBarberDirectoryService },
    {
      provide: CreateAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        availabilityService: AvailabilityService,
        userRepository: UserRepository,
        barberDirectory: BarberDirectory,
        transactionManager: TransactionManager,
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
              // Same cache namespace as the customer's — a barber's own
              // /me list is also keyed by their user id, and must be
              // invalidated when they gain a new appointment as the
              // professional.
              CacheKeyGenerator.customerAppointmentsPrefix(
                output.appointment.barberId,
              ),
              CacheKeyGenerator.todayAppointmentsPrefix(),
              CacheKeyGenerator.futureAppointmentsPrefix(),
            ],
          },
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        AVAILABILITY_SERVICE,
        USER_REPOSITORY,
        BARBER_DIRECTORY,
        TRANSACTION_MANAGER,
        EVENT_BUS,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: CancelAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CancelAppointmentUseCase(
            appointmentRepository,
            userRepository,
            eventBus,
          ),
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
              CacheKeyGenerator.customerAppointmentsPrefix(
                output.appointment.barberId,
              ),
              CacheKeyGenerator.todayAppointmentsPrefix(),
              CacheKeyGenerator.futureAppointmentsPrefix(),
            ],
          },
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        USER_REPOSITORY,
        EVENT_BUS,
        CACHE_INVALIDATION_SERVICE,
      ],
    },
    {
      provide: CancelAppointmentByAdminUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        eventBus: EventBus,
        cacheInvalidationService: CacheInvalidationService,
      ) =>
        new CacheInvalidatingUseCase(
          new CancelAppointmentByAdminUseCase(
            appointmentRepository,
            userRepository,
            eventBus,
          ),
          cacheInvalidationService,
          {
            // Same effect on cached data as CancelAppointmentUseCase — an
            // appointment left SCHEDULED, whoever triggered it.
            buildPrefixes: (_input, output) => [
              CacheKeyGenerator.appointmentPrefix(output.appointment.id),
              CacheKeyGenerator.barberTimeSlotsPrefix(
                output.appointment.barberId,
                output.appointment.startAt,
              ),
              CacheKeyGenerator.customerAppointmentsPrefix(
                output.appointment.customerId,
              ),
              CacheKeyGenerator.customerAppointmentsPrefix(
                output.appointment.barberId,
              ),
              CacheKeyGenerator.todayAppointmentsPrefix(),
              CacheKeyGenerator.futureAppointmentsPrefix(),
            ],
          },
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        USER_REPOSITORY,
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
        userRepository: UserRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListCustomerAppointmentsUseCase(
            appointmentRepository,
            userRepository,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.CUSTOMER_APPOINTMENTS,
            // Mirrors ListCustomerAppointmentsUseCase's own DEFAULT_PAGE.
            buildKey: (input) =>
              CacheKeyGenerator.customerAppointments(
                input.requesterId,
                input.page ?? 1,
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
      provide: ListTodayAppointmentsUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListTodayAppointmentsUseCase(
            appointmentRepository,
            userRepository,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.TODAY_APPOINTMENTS,
            // Mirrors ListTodayAppointmentsUseCase's own DEFAULT_PAGE.
            buildKey: (input) =>
              CacheKeyGenerator.todayAppointments(input.page ?? 1),
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
      provide: ListFutureAppointmentsUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListFutureAppointmentsUseCase(
            appointmentRepository,
            userRepository,
          ),
          cacheManager,
          cachePolicy,
          {
            resource: CacheResource.FUTURE_APPOINTMENTS,
            // Mirrors ListFutureAppointmentsUseCase's own DEFAULT_PAGE.
            buildKey: (input) =>
              CacheKeyGenerator.futureAppointments(
                input.page ?? 1,
                input.startAt,
                input.endAt,
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
      provide: ListAvailableTimeSlotsUseCase,
      useFactory: (
        barberDirectory: BarberDirectory,
        availabilityService: AvailabilityService,
        cacheManager: CacheManager,
        cachePolicy: CachePolicy,
      ) =>
        new CachedUseCase(
          new ListAvailableTimeSlotsUseCase(
            barberDirectory,
            availabilityService,
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
        CACHE_MANAGER,
        CACHE_POLICY,
      ],
    },
    {
      provide: CancelAppointmentsForBarberUnavailabilityUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
        eventBus: EventBus,
      ) =>
        new CancelAppointmentsForBarberUnavailabilityUseCase(
          appointmentRepository,
          userRepository,
          eventBus,
        ),
      inject: [APPOINTMENT_REPOSITORY, USER_REPOSITORY, EVENT_BUS],
    },
    BarberUnavailabilityCreatedConsumer,
  ],
})
export class SchedulingModule {}
