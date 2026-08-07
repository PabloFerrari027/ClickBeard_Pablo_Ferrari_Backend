import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { BarberMetricsQuery } from '../ports/barber-metrics-query.port';
import { GetOccupationMetricsUseCase } from './get-occupation-metrics.use-case';

function buildUser(id: string, role: UserRole): User {
  return User.restore({
    id,
    name: 'Requester',
    email: Email.create(`${id}@example.com`),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
  });
}

describe('GetOccupationMetricsUseCase', () => {
  let barberMetricsQuery: jest.Mocked<BarberMetricsQuery>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetOccupationMetricsUseCase;

  const now = new Date(2026, 7, 6, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    barberMetricsQuery = {
      countTotal: jest.fn(),
      countAppointmentsByBarber: jest.fn(),
      mostRequestedBarbers: jest.fn(),
      mostUsedQualifications: jest.fn(),
      occupancyByBarber: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new GetOccupationMetricsUseCase(
      barberMetricsQuery,
      userRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('averages the occupancy rate across barbers', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    barberMetricsQuery.occupancyByBarber.mockResolvedValue([
      {
        barberId: 'barber-1',
        barberName: 'John',
        bookedSlots: 8,
        availableSlots: 10,
        occupancyRate: 0.8,
        freeTimeSlots: [],
      },
      {
        barberId: 'barber-2',
        barberName: 'Paul',
        bookedSlots: 4,
        availableSlots: 10,
        occupancyRate: 0.4,
        freeTimeSlots: [],
      },
    ]);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(result.metrics.averageOccupancyRate).toBeCloseTo(0.6);
    expect(result.metrics.occupancyByBarber).toHaveLength(2);
  });

  it('returns a zero average when there are no barbers', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    barberMetricsQuery.occupancyByBarber.mockResolvedValue([]);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(result.metrics.averageOccupancyRate).toBe(0);
  });

  it('throws UserIsNotAdminError for a non-admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('barber-id', UserRole.BARBER),
    );

    await expect(
      useCase.execute({
        requesterId: 'barber-id',
        filter: { preset: PeriodPreset.MONTH },
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(barberMetricsQuery.occupancyByBarber).not.toHaveBeenCalled();
  });
});
