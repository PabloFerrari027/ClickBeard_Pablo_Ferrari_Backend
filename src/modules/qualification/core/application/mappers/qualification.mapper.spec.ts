import { Qualification } from '../../domain/entities/qualification.entity';
import { toQualificationDto } from './qualification.mapper';

describe('toQualificationDto', () => {
  it('maps a qualification entity to a qualification dto', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const qualification = Qualification.restore({
      id: 'qualification-id',
      name: 'Beard Trim',
      description: 'Trims and shapes beards',
      createdAt: now,
      updatedAt: now,
    });

    const dto = toQualificationDto(qualification);

    expect(dto).toEqual({
      id: 'qualification-id',
      name: 'Beard Trim',
      description: 'Trims and shapes beards',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('maps an undefined description as undefined', () => {
    const qualification = Qualification.create({ name: 'Haircut' });

    const dto = toQualificationDto(qualification);

    expect(dto.description).toBeUndefined();
  });
});
