import { CacheKeyGenerator } from './cache-key-generator';

describe('CacheKeyGenerator', () => {
  it('builds a user profile key', () => {
    expect(CacheKeyGenerator.userProfile('user-1').toString()).toBe(
      'user:user-1',
    );
  });

  it('builds barber and barbers-list keys', () => {
    expect(CacheKeyGenerator.barber('barber-1').toString()).toBe(
      'barber:barber-1',
    );
    expect(CacheKeyGenerator.barbersList(2).toString()).toBe('barbers:list:2');
    expect(CacheKeyGenerator.barbersListPrefix().toString()).toBe(
      'barbers:list:',
    );
  });

  it('builds a single global qualifications key', () => {
    expect(CacheKeyGenerator.qualifications().toString()).toBe(
      'qualifications',
    );
  });

  it('scopes the appointment key to the requester', () => {
    expect(
      CacheKeyGenerator.appointment('appointment-1', 'requester-1').toString(),
    ).toBe('appointment:appointment-1:requester-1');
    expect(
      CacheKeyGenerator.appointmentPrefix('appointment-1').toString(),
    ).toBe('appointment:appointment-1:');
  });

  it('builds customer appointments keys', () => {
    expect(
      CacheKeyGenerator.customerAppointments('customer-1', 1).toString(),
    ).toBe('appointments:customer-1:1');
    expect(
      CacheKeyGenerator.customerAppointmentsPrefix('customer-1').toString(),
    ).toBe('appointments:customer-1:');
  });

  it('builds today/future appointments keys, not scoped by requester', () => {
    expect(CacheKeyGenerator.todayAppointments(1).toString()).toBe(
      'appointments:today:1',
    );
    expect(CacheKeyGenerator.todayAppointmentsPrefix().toString()).toBe(
      'appointments:today:',
    );
    expect(CacheKeyGenerator.futureAppointments(2).toString()).toBe(
      'appointments:future:2',
    );
    expect(CacheKeyGenerator.futureAppointmentsPrefix().toString()).toBe(
      'appointments:future:',
    );
  });

  it('formats available time slots keys with a date-only segment', () => {
    const date = new Date('2026-08-06T15:30:00.000Z');

    expect(
      CacheKeyGenerator.availableTimeSlots(
        'barber-1',
        date,
        'qualification-1',
      ).toString(),
    ).toBe('time-slots:barber-1:2026-08-06:qualification-1');
    expect(
      CacheKeyGenerator.barberTimeSlotsPrefix('barber-1', date).toString(),
    ).toBe('time-slots:barber-1:2026-08-06:');
  });

  it('formats the all-dates time slots prefix for a barber', () => {
    expect(
      CacheKeyGenerator.barberAllTimeSlotsPrefix('barber-1').toString(),
    ).toBe('time-slots:barber-1:');
  });

  it('builds dashboard and generic metrics keys', () => {
    expect(CacheKeyGenerator.dashboardMetrics('MONTH').toString()).toBe(
      'dashboard:MONTH',
    );
    expect(CacheKeyGenerator.metrics('barbers', 'MONTH').toString()).toBe(
      'metrics:barbers:MONTH',
    );
  });

  it('builds customer metrics keys with and without a customerId', () => {
    expect(CacheKeyGenerator.customerMetrics('MONTH').toString()).toBe(
      'metrics:customers:MONTH:all',
    );
    expect(
      CacheKeyGenerator.customerMetrics('MONTH', 'customer-1').toString(),
    ).toBe('metrics:customers:MONTH:customer-1');
  });

  describe('periodKey', () => {
    it('returns the preset alone when no custom bounds are given', () => {
      expect(CacheKeyGenerator.periodKey('MONTH')).toBe('MONTH');
    });

    it('includes the ISO bounds when both are given', () => {
      const startAt = new Date('2026-01-01T00:00:00.000Z');
      const endAt = new Date('2026-01-31T23:59:59.999Z');

      expect(CacheKeyGenerator.periodKey('CUSTOM', startAt, endAt)).toBe(
        'CUSTOM:2026-01-01T00:00:00.000Z:2026-01-31T23:59:59.999Z',
      );
    });
  });
});
