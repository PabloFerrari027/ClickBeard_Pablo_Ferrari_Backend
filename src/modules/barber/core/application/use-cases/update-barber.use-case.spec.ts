import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { BarberRepository } from '../ports/barber-repository.port';
import { UpdateBarberUseCase } from './update-barber.use-case';

describe('UpdateBarberUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let useCase: UpdateBarberUseCase;

  function buildBarber(): Barber {
    return Barber.restore({
      id: 'barber-id',
      name: 'John Barber',
      age: Age.create(30),
      hiredAt: new Date('2025-01-01T00:00:00.000Z'),
      qualificationIds: ['qualification-id'],
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  }

  beforeEach(() => {
    barberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByQualificationId: jest.fn(),
    };
    qualificationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      listByBarberId: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new UpdateBarberUseCase(
      barberRepository,
      qualificationRepository,
    );
    qualificationRepository.listByBarberId.mockResolvedValue([]);
  });

  it('updates the age when provided', async () => {
    const barber = buildBarber();
    barberRepository.findById.mockResolvedValue(barber);

    const result = await useCase.execute({ barberId: 'barber-id', age: 40 });

    expect(barber.getAge().getValue()).toBe(40);
    expect(barberRepository.save).toHaveBeenCalledWith(barber);
    expect(result.barber.age).toBe(40);
  });

  it('updates the hiring date when provided', async () => {
    const barber = buildBarber();
    barberRepository.findById.mockResolvedValue(barber);
    const newHiredAt = new Date('2025-06-01T00:00:00.000Z');

    const result = await useCase.execute({
      barberId: 'barber-id',
      hiredAt: newHiredAt,
    });

    expect(barber.getHiredAt()).toBe(newHiredAt);
    expect(result.barber.hiredAt).toBe(newHiredAt);
  });

  it('leaves age and hiredAt unchanged when neither is provided', async () => {
    const barber = buildBarber();
    const originalAge = barber.getAge();
    const originalHiredAt = barber.getHiredAt();
    barberRepository.findById.mockResolvedValue(barber);

    await useCase.execute({ barberId: 'barber-id' });

    expect(barber.getAge()).toBe(originalAge);
    expect(barber.getHiredAt()).toBe(originalHiredAt);
  });

  it('throws BarberNotFoundError when the barber does not exist', async () => {
    barberRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ barberId: 'missing-id', age: 40 }),
    ).rejects.toThrow(BarberNotFoundError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });
});
