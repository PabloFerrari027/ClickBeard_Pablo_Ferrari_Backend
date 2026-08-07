import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { ListCustomerAppointmentsUseCase } from './list-customer-appointments.use-case';

function buildAppointment(id: string): Appointment {
  return Appointment.restore({
    id,
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

describe('ListCustomerAppointmentsUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let useCase: ListCustomerAppointmentsUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
    };
    useCase = new ListCustomerAppointmentsUseCase(appointmentRepository);
  });

  it('returns the paginated appointments for the given customer', async () => {
    appointmentRepository.findByCustomerId.mockResolvedValue({
      appointments: [buildAppointment('a'), buildAppointment('b')],
      total: 2,
    });

    const result = await useCase.execute({ customerId: 'customer-id' });

    expect(appointmentRepository.findByCustomerId).toHaveBeenCalledWith(
      'customer-id',
      1,
      100,
    );
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
      customerId: 'customer-id',
      page: -5,
    });

    expect(result.page).toBe(1);
  });
});
