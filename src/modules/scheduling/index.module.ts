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
import { USER_REPOSITORY } from '../identity/core/application/ports/user-repository.port';
import { CLOCK } from '../../shared/application/ports/clock.port';
import { EVENT_BUS } from '../../shared/application/ports/event-bus.port';

import type { AppointmentRepository } from './core/application/ports/appointment-repository.port';
import type { AvailabilityService } from './core/application/ports/availability-service.port';
import type { BarberDirectory } from './core/application/ports/barber-directory.port';
import type { TransactionManager } from './core/application/ports/transaction-manager.port';
import type { UserRepository } from '../identity/core/application/ports/user-repository.port';
import type { Clock } from '../../shared/application/ports/clock.port';
import type { EventBus } from '../../shared/application/ports/event-bus.port';

@Module({
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
      ) =>
        new CreateAppointmentUseCase(
          appointmentRepository,
          availabilityService,
          userRepository,
          barberDirectory,
          transactionManager,
          clock,
          eventBus,
        ),
      inject: [
        APPOINTMENT_REPOSITORY,
        AVAILABILITY_SERVICE,
        USER_REPOSITORY,
        BARBER_DIRECTORY,
        TRANSACTION_MANAGER,
        CLOCK,
        EVENT_BUS,
      ],
    },
    {
      provide: CancelAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        clock: Clock,
        eventBus: EventBus,
      ) => new CancelAppointmentUseCase(appointmentRepository, clock, eventBus),
      inject: [APPOINTMENT_REPOSITORY, CLOCK, EVENT_BUS],
    },
    {
      provide: GetAppointmentUseCase,
      useFactory: (
        appointmentRepository: AppointmentRepository,
        userRepository: UserRepository,
      ) => new GetAppointmentUseCase(appointmentRepository, userRepository),
      inject: [APPOINTMENT_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: ListCustomerAppointmentsUseCase,
      useFactory: (appointmentRepository: AppointmentRepository) =>
        new ListCustomerAppointmentsUseCase(appointmentRepository),
      inject: [APPOINTMENT_REPOSITORY],
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
      ) =>
        new ListAvailableTimeSlotsUseCase(
          barberDirectory,
          availabilityService,
          clock,
        ),
      inject: [BARBER_DIRECTORY, AVAILABILITY_SERVICE, CLOCK],
    },
  ],
})
export class SchedulingModule {}
