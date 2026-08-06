import { BarberDoesNotHaveQualificationError } from '../../domain/errors/barber-does-not-have-qualification.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AvailabilityService } from '../ports/availability-service.port';
import { BarberDirectory } from '../ports/barber-directory.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { ListAvailableTimeSlotsUseCase } from './list-available-time-slots.use-case';

describe('ListAvailableTimeSlotsUseCase', () => {
  let barberDirectory: jest.Mocked<BarberDirectory>;
  let availabilityService: jest.Mocked<AvailabilityService>;
  let clock: jest.Mocked<Clock>;
  let useCase: ListAvailableTimeSlotsUseCase;

  const date = new Date(2026, 0, 10, 0, 0, 0, 0);

  beforeEach(() => {
    barberDirectory = {
      findById: jest.fn(),
    };
    availabilityService = {
      isBarberAvailable: jest.fn(),
      getBookedSlots: jest.fn(),
    };
    clock = {
      now: jest.fn().mockReturnValue(new Date(2026, 0, 1, 0, 0, 0, 0)),
    };
    useCase = new ListAvailableTimeSlotsUseCase(
      barberDirectory,
      availabilityService,
      clock,
    );

    barberDirectory.findById.mockResolvedValue({
      id: 'barber-id',
      qualificationIds: ['qualification-id'],
      active: true,
    });
  });

  it('returns all 20 daily slots when none are booked', async () => {
    availabilityService.getBookedSlots.mockResolvedValue([]);

    const result = await useCase.execute({
      barberId: 'barber-id',
      qualificationId: 'qualification-id',
      date,
    });

    expect(result.timeSlots).toHaveLength(20);
  });

  it('excludes already booked slots', async () => {
    availabilityService.getBookedSlots.mockResolvedValue([
      TimeSlot.create(new Date(2026, 0, 10, 9, 0, 0, 0)),
    ]);

    const result = await useCase.execute({
      barberId: 'barber-id',
      qualificationId: 'qualification-id',
      date,
    });

    expect(result.timeSlots).toHaveLength(19);
    expect(
      result.timeSlots.some(
        (slot) =>
          slot.startAt.getTime() ===
          new Date(2026, 0, 10, 9, 0, 0, 0).getTime(),
      ),
    ).toBe(false);
  });

  it('excludes slots that have already passed today', async () => {
    availabilityService.getBookedSlots.mockResolvedValue([]);
    clock.now.mockReturnValue(new Date(2026, 0, 10, 12, 0, 0, 0));

    const result = await useCase.execute({
      barberId: 'barber-id',
      qualificationId: 'qualification-id',
      date,
    });

    expect(
      result.timeSlots.every(
        (slot) =>
          slot.startAt.getTime() >=
          new Date(2026, 0, 10, 12, 0, 0, 0).getTime(),
      ),
    ).toBe(true);
  });

  it('throws BarberNotFoundError when the barber does not exist', async () => {
    barberDirectory.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        barberId: 'missing',
        qualificationId: 'qualification-id',
        date,
      }),
    ).rejects.toThrow(BarberNotFoundError);
  });

  it('throws BarberDoesNotHaveQualificationError when the barber lacks the qualification', async () => {
    barberDirectory.findById.mockResolvedValue({
      id: 'barber-id',
      qualificationIds: ['other-qualification'],
      active: true,
    });

    await expect(
      useCase.execute({
        barberId: 'barber-id',
        qualificationId: 'qualification-id',
        date,
      }),
    ).rejects.toThrow(BarberDoesNotHaveQualificationError);
  });

  it('throws BarberNotFoundError when the barber is inactive', async () => {
    barberDirectory.findById.mockResolvedValue({
      id: 'barber-id',
      qualificationIds: ['qualification-id'],
      active: false,
    });

    await expect(
      useCase.execute({
        barberId: 'barber-id',
        qualificationId: 'qualification-id',
        date,
      }),
    ).rejects.toThrow(BarberNotFoundError);
  });
});
