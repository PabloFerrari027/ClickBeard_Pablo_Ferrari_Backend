import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { AppointmentAccessDeniedError } from '../../domain/errors/appointment-access-denied.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { GetAppointmentUseCase } from './get-appointment.use-case';

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

describe('GetAppointmentUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetAppointmentUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
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
    useCase = new GetAppointmentUseCase(appointmentRepository, userRepository);
  });

  it('returns the appointment when the requester is the owner', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());

    const result = await useCase.execute({
      appointmentId: 'appointment-id',
      requesterId: 'customer-id',
    });

    expect(result.appointment.id).toBe('appointment-id');
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('returns the appointment when the requester is an admin', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );

    const result = await useCase.execute({
      appointmentId: 'appointment-id',
      requesterId: 'admin-id',
    });

    expect(result.appointment.id).toBe('appointment-id');
  });

  it('throws AppointmentAccessDeniedError for a non-owner, non-admin requester', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());
    userRepository.findById.mockResolvedValue(
      buildUser('other-id', UserRole.CLIENT),
    );

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        requesterId: 'other-id',
      }),
    ).rejects.toThrow(AppointmentAccessDeniedError);
  });

  it('throws AppointmentNotFoundError when the appointment does not exist', async () => {
    appointmentRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        appointmentId: 'missing-id',
        requesterId: 'customer-id',
      }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });
});
