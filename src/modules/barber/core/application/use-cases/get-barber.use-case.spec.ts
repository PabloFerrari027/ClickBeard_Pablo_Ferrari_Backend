import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { BarberRepository } from '../ports/barber-repository.port';
import { GetBarberUseCase } from './get-barber.use-case';

describe('GetBarberUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let useCase: GetBarberUseCase;

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
    useCase = new GetBarberUseCase(barberRepository, qualificationRepository);
  });

  it('returns the barber dto with its qualifications', async () => {
    const barber = Barber.create({
      userId: 'barber-id',
      name: 'John Barber',
      age: Age.create(30),
      hiredAt: new Date('2025-01-01T00:00:00.000Z'),
      qualificationIds: ['qualification-id'],
    });
    barberRepository.findById.mockResolvedValue(barber);
    qualificationRepository.listByBarberId.mockResolvedValue([]);

    const result = await useCase.execute({ barberId: 'barber-id' });

    expect(barberRepository.findById).toHaveBeenCalledWith('barber-id');
    expect(qualificationRepository.listByBarberId).toHaveBeenCalledWith(
      'barber-id',
    );
    expect(result.barber.id).toBe('barber-id');
  });

  it('throws BarberNotFoundError when the barber does not exist', async () => {
    barberRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ barberId: 'missing-id' })).rejects.toThrow(
      BarberNotFoundError,
    );
  });
});
