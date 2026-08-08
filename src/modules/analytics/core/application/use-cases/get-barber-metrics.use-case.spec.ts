import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { BarberMetricsQuery } from '../ports/barber-metrics-query.port';
import { GetBarberMetricsUseCase } from './get-barber-metrics.use-case';

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

describe('GetBarberMetricsUseCase', () => {
  let barberMetricsQuery: jest.Mocked<BarberMetricsQuery>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetBarberMetricsUseCase;

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
      findAll: jest.fn(),
    };
    useCase = new GetBarberMetricsUseCase(barberMetricsQuery, userRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns aggregated barber metrics for an admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    barberMetricsQuery.countTotal.mockResolvedValue(8);
    barberMetricsQuery.countAppointmentsByBarber.mockResolvedValue([
      { barberId: 'barber-1', barberName: 'John', total: 15 },
    ]);
    barberMetricsQuery.mostRequestedBarbers.mockResolvedValue([
      { barberId: 'barber-1', barberName: 'John', total: 15 },
    ]);
    barberMetricsQuery.mostUsedQualifications.mockResolvedValue([
      { qualificationId: 'qual-1', qualificationName: 'Fade', total: 20 },
    ]);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(result.metrics.totalBarbers).toBe(8);
    expect(result.metrics.appointmentsByBarber).toHaveLength(1);
    expect(result.metrics.mostRequestedBarbers).toHaveLength(1);
    expect(result.metrics.mostUsedQualifications).toHaveLength(1);
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
    expect(barberMetricsQuery.countTotal).not.toHaveBeenCalled();
  });
});
