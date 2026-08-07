import { InvalidUnavailabilityPeriodError } from '../errors/invalid-unavailability-period.error';
import { UnavailabilityReasonRequiredError } from '../errors/unavailability-reason-required.error';
import { BarberUnavailability } from './barber-unavailability.entity';

describe('BarberUnavailability', () => {
  describe('create', () => {
    it('creates an unavailability period with a generated id and trimmed reason', () => {
      const now = new Date(2026, 0, 1, 0, 0, 0, 0);

      const unavailability = BarberUnavailability.create({
        barberId: 'barber-id',
        startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
        endAt: new Date(2026, 0, 12, 0, 0, 0, 0),
        reason: '  Sick leave  ',
        now,
      });

      expect(unavailability.getId()).toBeTruthy();
      expect(unavailability.getBarberId()).toBe('barber-id');
      expect(unavailability.getReason()).toBe('Sick leave');
      expect(unavailability.getCreatedAt()).toEqual(now);
    });

    it('throws InvalidUnavailabilityPeriodError when end is not after start', () => {
      const now = new Date(2026, 0, 1, 0, 0, 0, 0);

      expect(() =>
        BarberUnavailability.create({
          barberId: 'barber-id',
          startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
          endAt: new Date(2026, 0, 10, 0, 0, 0, 0),
          reason: 'Sick leave',
          now,
        }),
      ).toThrow(InvalidUnavailabilityPeriodError);

      expect(() =>
        BarberUnavailability.create({
          barberId: 'barber-id',
          startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
          endAt: new Date(2026, 0, 9, 0, 0, 0, 0),
          reason: 'Sick leave',
          now,
        }),
      ).toThrow(InvalidUnavailabilityPeriodError);
    });

    it('throws UnavailabilityReasonRequiredError when the reason is blank or too short', () => {
      const now = new Date(2026, 0, 1, 0, 0, 0, 0);
      const validPeriod = {
        barberId: 'barber-id',
        startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
        endAt: new Date(2026, 0, 12, 0, 0, 0, 0),
        now,
      };

      expect(() =>
        BarberUnavailability.create({ ...validPeriod, reason: '   ' }),
      ).toThrow(UnavailabilityReasonRequiredError);

      expect(() =>
        BarberUnavailability.create({ ...validPeriod, reason: 'ab' }),
      ).toThrow(UnavailabilityReasonRequiredError);
    });
  });

  describe('restore', () => {
    it('rehydrates a period without re-validating it', () => {
      const props = {
        id: 'fixed-id',
        barberId: 'barber-id',
        startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
        endAt: new Date(2026, 0, 12, 0, 0, 0, 0),
        reason: 'Sick leave',
        createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
      };

      const unavailability = BarberUnavailability.restore(props);

      expect(unavailability.getId()).toBe('fixed-id');
      expect(unavailability.getStartAt()).toEqual(props.startAt);
      expect(unavailability.getEndAt()).toEqual(props.endAt);
    });
  });
});
