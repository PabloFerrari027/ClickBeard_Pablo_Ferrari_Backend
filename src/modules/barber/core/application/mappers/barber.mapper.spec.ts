import { Qualification } from '../../../../qualification/core/domain/entities/qualification.entity';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { toBarberDto } from './barber.mapper';

describe('toBarberDto', () => {
  it('maps a barber entity and its qualifications to a barber dto', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const hiredAt = new Date('2025-01-01T00:00:00.000Z');
    const barber = Barber.restore({
      id: 'barber-id',
      name: 'John Barber',
      age: Age.create(30),
      hiredAt,
      qualificationIds: ['qualification-id'],
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    const qualification = Qualification.restore({
      id: 'qualification-id',
      name: 'Beard Trim',
      description: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const dto = toBarberDto(barber, [qualification]);

    expect(dto).toEqual({
      id: 'barber-id',
      userId: 'barber-id',
      name: 'John Barber',
      age: 30,
      hiredAt,
      qualifications: [
        {
          id: 'qualification-id',
          name: 'Beard Trim',
          description: undefined,
          createdAt: now,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  });

  it('maps an empty qualifications list to an empty array', () => {
    const barber = Barber.create({
      userId: 'barber-id',
      name: 'John Barber',
      age: Age.create(30),
      hiredAt: new Date('2025-01-01T00:00:00.000Z'),
      qualificationIds: ['qualification-id'],
    });

    const dto = toBarberDto(barber, []);

    expect(dto.qualifications).toEqual([]);
  });
});
