import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { UserMetricsQuery } from '../ports/user-metrics-query.port';
import { GetUserMetricsUseCase } from './get-user-metrics.use-case';

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

describe('GetUserMetricsUseCase', () => {
  let userMetricsQuery: jest.Mocked<UserMetricsQuery>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetUserMetricsUseCase;

  const now = new Date(2026, 7, 6, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    userMetricsQuery = {
      countTotal: jest.fn(),
      countByRole: jest.fn(),
      countActive: jest.fn(),
      countInactive: jest.fn(),
      countRegisteredInRange: jest.fn(),
      countPendingVerification: jest.fn(),
      countVerified: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new GetUserMetricsUseCase(userMetricsQuery, userRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns aggregated user metrics for an admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    userMetricsQuery.countTotal.mockResolvedValue(42);
    userMetricsQuery.countByRole.mockResolvedValue([
      { role: UserRole.CLIENT, total: 30 },
      { role: UserRole.BARBER, total: 10 },
      { role: UserRole.ADMIN, total: 2 },
    ]);
    userMetricsQuery.countActive.mockResolvedValue(40);
    userMetricsQuery.countInactive.mockResolvedValue(2);
    userMetricsQuery.countRegisteredInRange.mockResolvedValue(5);
    userMetricsQuery.countPendingVerification.mockResolvedValue(3);
    userMetricsQuery.countVerified.mockResolvedValue(39);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(result.metrics).toEqual({
      totalUsers: 42,
      totalByRole: [
        { role: UserRole.CLIENT, total: 30 },
        { role: UserRole.BARBER, total: 10 },
        { role: UserRole.ADMIN, total: 2 },
      ],
      activeUsers: 40,
      inactiveUsers: 2,
      newUsersInPeriod: 5,
      pendingVerification: 3,
      verifiedAccounts: 39,
    });
  });

  it('throws UserIsNotAdminError for a non-admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('customer-id', UserRole.CLIENT),
    );

    await expect(
      useCase.execute({
        requesterId: 'customer-id',
        filter: { preset: PeriodPreset.MONTH },
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(userMetricsQuery.countTotal).not.toHaveBeenCalled();
  });
});
