import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { InvalidAppointmentPeriodError } from '../../domain/errors/invalid-appointment-period.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { ListFutureAppointmentsUseCase } from './list-future-appointments.use-case';

function buildAppointment(): Appointment {
  return Appointment.restore({
    id: 'appointment-id',
    customerId: 'customer-id',
    barberId: 'barber-id',
    qualificationId: 'qualification-id',
    timeSlot: TimeSlot.create(new Date(2026, 0, 15, 10, 0, 0, 0)),
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    cancelledAt: null,
    cancellationReason: null,
  });
}

function buildUser(id: string, role: UserRole): User {
  return User.restore({
    id,
    name: 'Requester',
    email: Email.create(`${id}@example.com`),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
  });
}

describe('ListFutureAppointmentsUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ListFutureAppointmentsUseCase;

  const now = new Date(2026, 0, 10, 12, 0, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByBarberId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
      findScheduledByBarberAndRange: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new ListFutureAppointmentsUseCase(
      appointmentRepository,
      userRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns upcoming paginated appointments for an admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    appointmentRepository.findUpcoming.mockResolvedValue({
      appointments: [buildAppointment()],
      total: 1,
    });

    const result = await useCase.execute({ requesterId: 'admin-id' });

    expect(appointmentRepository.findUpcoming).toHaveBeenCalledWith(
      now,
      1,
      100,
      undefined,
    );
    expect(result.appointments).toHaveLength(1);
  });

  it('throws UserIsNotAdminError for a non-admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('customer-id', UserRole.CLIENT),
    );

    await expect(
      useCase.execute({ requesterId: 'customer-id' }),
    ).rejects.toThrow(UserIsNotAdminError);
  });

  it('narrows the listing to a future startAt/endAt period', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    appointmentRepository.findUpcoming.mockResolvedValue({
      appointments: [buildAppointment()],
      total: 1,
    });

    const startAt = new Date(2026, 0, 20, 0, 0, 0, 0);
    const endAt = new Date(2026, 0, 25, 23, 59, 59, 999);

    await useCase.execute({ requesterId: 'admin-id', startAt, endAt });

    expect(appointmentRepository.findUpcoming).toHaveBeenCalledWith(
      startAt,
      1,
      100,
      endAt,
    );
  });

  it('clamps a startAt in the past up to "now"', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    appointmentRepository.findUpcoming.mockResolvedValue({
      appointments: [],
      total: 0,
    });

    const startAt = new Date(2020, 0, 1, 0, 0, 0, 0);

    await useCase.execute({ requesterId: 'admin-id', startAt });

    expect(appointmentRepository.findUpcoming).toHaveBeenCalledWith(
      now,
      1,
      100,
      undefined,
    );
  });

  it('throws InvalidAppointmentPeriodError when startAt is after endAt', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );

    const startAt = new Date(2026, 0, 25, 0, 0, 0, 0);
    const endAt = new Date(2026, 0, 20, 0, 0, 0, 0);

    await expect(
      useCase.execute({ requesterId: 'admin-id', startAt, endAt }),
    ).rejects.toThrow(InvalidAppointmentPeriodError);
    expect(appointmentRepository.findUpcoming).not.toHaveBeenCalled();
  });
});
