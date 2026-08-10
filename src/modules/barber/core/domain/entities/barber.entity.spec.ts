import { BarberMustHaveAtLeastOneQualificationError } from '../errors/barber-must-have-at-least-one-qualification.error';
import { InvalidHiringDateError } from '../errors/invalid-hiring-date.error';
import { QualificationAlreadyAssignedError } from '../errors/qualification-already-assigned.error';
import { QualificationNotAssignedError } from '../errors/qualification-not-assigned.error';
import { Age } from '../value-objects/age.value-object';
import { Barber, BarberProps } from './barber.entity';

function buildProps(overrides: Partial<BarberProps> = {}): BarberProps {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'barber-id',
    name: 'John Barber',
    age: Age.create(30),
    hiredAt: new Date('2025-01-01T00:00:00.000Z'),
    qualificationIds: ['qualification-1'],
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Barber', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('creates a barber with unique, deduplicated qualification ids', () => {
      const barber = Barber.create({
        userId: 'user-id',
        name: 'John Barber',
        age: Age.create(30),
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['q1', 'q2', 'q1'],
      });

      expect(barber.getId()).toBe('user-id');
      expect(barber.getName()).toBe('John Barber');
      expect(barber.getQualificationIds()).toEqual(['q1', 'q2']);
      expect(barber.getCreatedAt()).toEqual(barber.getUpdatedAt());
      expect(barber.isActive()).toBe(true);
    });

    it('throws BarberMustHaveAtLeastOneQualificationError when no qualifications are given', () => {
      expect(() =>
        Barber.create({
          userId: 'user-id',
          name: 'John Barber',
          age: Age.create(30),
          hiredAt: new Date('2025-01-01T00:00:00.000Z'),
          qualificationIds: [],
        }),
      ).toThrow(BarberMustHaveAtLeastOneQualificationError);
    });

    it('throws InvalidHiringDateError when the hiring date is in the future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(() =>
        Barber.create({
          userId: 'user-id',
          name: 'John Barber',
          age: Age.create(30),
          hiredAt: futureDate,
          qualificationIds: ['q1'],
        }),
      ).toThrow(InvalidHiringDateError);
    });
  });

  describe('restore', () => {
    it('rebuilds a barber from persisted props without transforming them', () => {
      const props = buildProps();

      const barber = Barber.restore(props);

      expect(barber.getId()).toBe(props.id);
      expect(barber.getName()).toBe(props.name);
      expect(barber.getAge()).toBe(props.age);
      expect(barber.getHiredAt()).toBe(props.hiredAt);
      expect(barber.getQualificationIds()).toEqual(props.qualificationIds);
      expect(barber.getCreatedAt()).toBe(props.createdAt);
      expect(barber.getUpdatedAt()).toBe(props.updatedAt);
    });
  });

  describe('updateAge', () => {
    it('replaces the age and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const barber = Barber.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      const newAge = Age.create(40);
      barber.updateAge(newAge);

      expect(barber.getAge()).toBe(newAge);
      expect(barber.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });
  });

  describe('updateHiredAt', () => {
    it('replaces the hiring date and updates updatedAt when valid', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const barber = Barber.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      const newHiredAt = new Date('2025-06-01T00:00:00.000Z');
      barber.updateHiredAt(newHiredAt);

      expect(barber.getHiredAt()).toBe(newHiredAt);
      expect(barber.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });

    it('throws InvalidHiringDateError when the new hiring date is in the future', () => {
      const barber = Barber.restore(buildProps());
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(() => barber.updateHiredAt(futureDate)).toThrow(
        InvalidHiringDateError,
      );
    });
  });

  describe('addQualification', () => {
    it('appends the qualification id and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const barber = Barber.restore(buildProps({ qualificationIds: ['q1'] }));

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      barber.addQualification('q2');

      expect(barber.getQualificationIds()).toEqual(['q1', 'q2']);
      expect(barber.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });

    it('throws QualificationAlreadyAssignedError when the qualification is already assigned', () => {
      const barber = Barber.restore(buildProps({ qualificationIds: ['q1'] }));

      expect(() => barber.addQualification('q1')).toThrow(
        QualificationAlreadyAssignedError,
      );
    });
  });

  describe('removeQualification', () => {
    it('removes the qualification id and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const barber = Barber.restore(
        buildProps({ qualificationIds: ['q1', 'q2'] }),
      );

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      barber.removeQualification('q1');

      expect(barber.getQualificationIds()).toEqual(['q2']);
      expect(barber.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });

    it('throws QualificationNotAssignedError when the qualification is not assigned', () => {
      const barber = Barber.restore(buildProps({ qualificationIds: ['q1'] }));

      expect(() => barber.removeQualification('q2')).toThrow(
        QualificationNotAssignedError,
      );
    });

    it('throws BarberMustHaveAtLeastOneQualificationError when removing the last qualification', () => {
      const barber = Barber.restore(buildProps({ qualificationIds: ['q1'] }));

      expect(() => barber.removeQualification('q1')).toThrow(
        BarberMustHaveAtLeastOneQualificationError,
      );
    });
  });

  describe('deactivate', () => {
    it('marks the barber inactive and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const barber = Barber.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      barber.deactivate();

      expect(barber.isActive()).toBe(false);
      expect(barber.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });
  });

  describe('reactivate', () => {
    it('marks the barber active again, preserving its other data, and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const barber = Barber.restore(buildProps({ active: false }));

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      barber.reactivate();

      expect(barber.isActive()).toBe(true);
      expect(barber.getAge()).toEqual(buildProps().age);
      expect(barber.getQualificationIds()).toEqual(
        buildProps().qualificationIds,
      );
      expect(barber.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });
  });

  describe('getQualificationIds', () => {
    it('returns a copy that does not mutate the internal state', () => {
      const barber = Barber.restore(buildProps({ qualificationIds: ['q1'] }));

      const ids = barber.getQualificationIds();
      ids.push('q2');

      expect(barber.getQualificationIds()).toEqual(['q1']);
    });
  });
});
