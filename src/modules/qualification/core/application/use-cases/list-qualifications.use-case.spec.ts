import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { ListQualificationsUseCase } from './list-qualifications.use-case';

describe('ListQualificationsUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let useCase: ListQualificationsUseCase;

  beforeEach(() => {
    qualificationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      listByBarberId: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ListQualificationsUseCase(qualificationRepository);
  });

  it('returns all qualifications mapped to dtos', async () => {
    const qualifications = [
      Qualification.create({ name: 'Beard Trim' }),
      Qualification.create({ name: 'Fade Cut' }),
    ];
    qualificationRepository.findAll.mockResolvedValue(qualifications);

    const result = await useCase.execute();

    expect(result.qualifications).toHaveLength(2);
    expect(result.qualifications.map((q) => q.name)).toEqual([
      'Beard Trim',
      'Fade Cut',
    ]);
  });

  it('returns an empty list when there are no qualifications', async () => {
    qualificationRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.qualifications).toEqual([]);
  });
});
