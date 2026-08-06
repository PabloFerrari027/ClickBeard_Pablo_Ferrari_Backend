import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { BarberRepository } from '../ports/barber-repository.port';
import { ListBarbersUseCase } from './list-barbers.use-case';

describe('ListBarbersUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let useCase: ListBarbersUseCase;

  function buildBarber(id: string): Barber {
    return Barber.create({
      userId: id,
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
    qualificationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      listByBarberId: jest.fn(),
      delete: jest.fn(),
    };
    qualificationRepository.listByBarberId.mockResolvedValue([]);
    useCase = new ListBarbersUseCase(barberRepository, qualificationRepository);
  });

  it('lists barbers using the default page when none is provided', async () => {
    barberRepository.findAll.mockResolvedValue({
      barbers: [buildBarber('barber-1')],
      total: 1,
    });

    const result = await useCase.execute({});

    expect(barberRepository.findAll).toHaveBeenCalledWith(1, 100);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.barbers).toHaveLength(1);
  });

  it('uses the given page when it is a positive number', async () => {
    barberRepository.findAll.mockResolvedValue({ barbers: [], total: 0 });

    const result = await useCase.execute({ page: 3 });

    expect(barberRepository.findAll).toHaveBeenCalledWith(3, 100);
    expect(result.page).toBe(3);
  });

  it('falls back to the default page when the given page is not positive', async () => {
    barberRepository.findAll.mockResolvedValue({ barbers: [], total: 0 });

    const result = await useCase.execute({ page: 0 });

    expect(barberRepository.findAll).toHaveBeenCalledWith(1, 100);
    expect(result.page).toBe(1);
  });

  it('computes totalPages from the total count and default limit', async () => {
    barberRepository.findAll.mockResolvedValue({
      barbers: [buildBarber('barber-1')],
      total: 250,
    });

    const result = await useCase.execute({});

    expect(result.totalPages).toBe(3);
  });

  it('fetches qualifications for each barber independently', async () => {
    barberRepository.findAll.mockResolvedValue({
      barbers: [buildBarber('barber-1'), buildBarber('barber-2')],
      total: 2,
    });

    await useCase.execute({});

    expect(qualificationRepository.listByBarberId).toHaveBeenCalledWith(
      'barber-1',
    );
    expect(qualificationRepository.listByBarberId).toHaveBeenCalledWith(
      'barber-2',
    );
  });
});
