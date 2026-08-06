import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { ListTodayAppointmentsUseCase } from './list-today-appointments.use-case';

function buildAppointment(): Appointment {
  return Appointment.restore({
    id: 'appointment-id',
    customerId: 'customer-id',
    barberId: 'barber-id',
    qualificationId: 'qualification-id',
    timeSlot: TimeSlot.create(new Date(2026, 0, 10, 10, 0, 0, 0)),
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    cancelledAt: null,
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

describe('ListTodayAppointmentsUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let clock: jest.Mocked<Clock>;
  let useCase: ListTodayAppointmentsUseCase;

  const now = new Date(2026, 0, 10, 12, 0, 0, 0);

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    clock = {
      now: jest.fn().mockReturnValue(now),
    };
    useCase = new ListTodayAppointmentsUseCase(
      appointmentRepository,
      userRepository,
      clock,
    );
  });

  it("returns today's paginated appointments for an admin requester", async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    appointmentRepository.findByDate.mockResolvedValue({
      appointments: [buildAppointment()],
      total: 1,
    });

    const result = await useCase.execute({ requesterId: 'admin-id' });

    expect(appointmentRepository.findByDate).toHaveBeenCalledWith(now, 1, 100);
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

  it('throws UserNotFoundError when the requester does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'missing-id' }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
