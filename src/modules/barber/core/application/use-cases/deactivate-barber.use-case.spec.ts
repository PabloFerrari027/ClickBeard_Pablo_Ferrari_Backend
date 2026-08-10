import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { BarberRepository } from '../ports/barber-repository.port';
import { DeactivateBarberUseCase } from './deactivate-barber.use-case';

describe('DeactivateBarberUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let useCase: DeactivateBarberUseCase;

  function buildBarber(): Barber {
    return Barber.create({
      userId: 'barber-id',
      name: 'John Barber',
      age: Age.create(30),
      hiredAt: new Date('2025-01-01T00:00:00.000Z'),
      qualificationIds: ['qualification-id'],
    });
  }

  beforeEach(() => {
    barberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByQualificationId: jest.fn(),
    };
    useCase = new DeactivateBarberUseCase(barberRepository);
  });

  it('deactivates an active barber', async () => {
    const barber = buildBarber();
    barberRepository.findById.mockResolvedValue(barber);

    await useCase.execute({ barberId: 'barber-id' });

    expect(barber.isActive()).toBe(false);
    expect(barberRepository.save).toHaveBeenCalledWith(barber);
  });

  it('does nothing when the barber does not exist', async () => {
    barberRepository.findById.mockResolvedValue(null);

    await useCase.execute({ barberId: 'missing-id' });

    expect(barberRepository.save).not.toHaveBeenCalled();
  });

  it('does nothing when the barber is already inactive', async () => {
    const barber = buildBarber();
    barber.deactivate();
    barberRepository.findById.mockResolvedValue(barber);

    await useCase.execute({ barberId: 'barber-id' });

    expect(barberRepository.save).not.toHaveBeenCalled();
  });
});
