import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { ListCustomerAppointmentsUseCase } from './list-customer-appointments.use-case';

function buildAppointment(
  id: string,
  customerId: string,
  barberId: string,
  hour: number,
): Appointment {
  return Appointment.restore({
    id,
    customerId,
    barberId,
    qualificationId: 'qualification-id',
    timeSlot: TimeSlot.create(new Date(2026, 0, 10, hour, 0, 0, 0)),
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

describe('ListCustomerAppointmentsUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ListCustomerAppointmentsUseCase;

  beforeEach(() => {
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
    useCase = new ListCustomerAppointmentsUseCase(
      appointmentRepository,
      userRepository,
    );
  });

  describe('when the requester is a CLIENT', () => {
    beforeEach(() => {
      userRepository.findById.mockResolvedValue(
        buildUser('customer-id', UserRole.CLIENT),
      );
    });

    it('returns the paginated appointments for the given customer', async () => {
      appointmentRepository.findByCustomerId.mockResolvedValue({
        appointments: [
          buildAppointment('a', 'customer-id', 'barber-id', 10),
          buildAppointment('b', 'customer-id', 'barber-id', 11),
        ],
        total: 2,
      });

      const result = await useCase.execute({ requesterId: 'customer-id' });

      expect(appointmentRepository.findByCustomerId).toHaveBeenCalledWith(
        'customer-id',
        1,
        100,
      );
      expect(appointmentRepository.findByBarberId).not.toHaveBeenCalled();
      expect(result.appointments).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('falls back to page 1 for an invalid page number', async () => {
      appointmentRepository.findByCustomerId.mockResolvedValue({
        appointments: [],
        total: 0,
      });

      const result = await useCase.execute({
        requesterId: 'customer-id',
        page: -5,
      });

      expect(result.page).toBe(1);
    });
  });

  describe('when the requester is a BARBER', () => {
    it('returns appointments where the barber is only the customer', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser('barber-id', UserRole.BARBER),
      );
      appointmentRepository.findByCustomerId.mockResolvedValue({
        appointments: [buildAppointment('a', 'barber-id', 'other-barber', 10)],
        total: 1,
      });
      appointmentRepository.findByBarberId.mockResolvedValue({
        appointments: [],
        total: 0,
      });

      const result = await useCase.execute({ requesterId: 'barber-id' });

      expect(appointmentRepository.findByCustomerId).toHaveBeenCalledWith(
        'barber-id',
        1,
        100,
      );
      expect(appointmentRepository.findByBarberId).toHaveBeenCalledWith(
        'barber-id',
        1,
        100,
      );
      expect(result.appointments.map((a) => a.id)).toEqual(['a']);
    });

    it('returns appointments where the barber is only the professional', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser('barber-id', UserRole.BARBER),
      );
      appointmentRepository.findByCustomerId.mockResolvedValue({
        appointments: [],
        total: 0,
      });
      appointmentRepository.findByBarberId.mockResolvedValue({
        appointments: [buildAppointment('b', 'some-customer', 'barber-id', 9)],
        total: 1,
      });

      const result = await useCase.execute({ requesterId: 'barber-id' });

      expect(result.appointments.map((a) => a.id)).toEqual(['b']);
    });

    it('merges both roles, sorted by start time, without duplicating a self-booked appointment', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser('barber-id', UserRole.BARBER),
      );
      const asProfessional = buildAppointment(
        'as-professional',
        'some-customer',
        'barber-id',
        9,
      );
      const selfBooked = buildAppointment(
        'self-booked',
        'barber-id',
        'barber-id',
        14,
      );
      const asCustomer = buildAppointment(
        'as-customer',
        'barber-id',
        'other-barber',
        11,
      );

      appointmentRepository.findByCustomerId.mockResolvedValue({
        appointments: [selfBooked, asCustomer],
        total: 2,
      });
      appointmentRepository.findByBarberId.mockResolvedValue({
        appointments: [asProfessional, selfBooked],
        total: 2,
      });

      const result = await useCase.execute({ requesterId: 'barber-id' });

      expect(result.appointments.map((a) => a.id)).toEqual([
        'as-professional',
        'as-customer',
        'self-booked',
      ]);
    });
  });
});
