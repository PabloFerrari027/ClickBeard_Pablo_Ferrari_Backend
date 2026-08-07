import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { CustomerMetricsQuery } from '../ports/customer-metrics-query.port';
import { GetCustomerMetricsUseCase } from './get-customer-metrics.use-case';

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

describe('GetCustomerMetricsUseCase', () => {
  let customerMetricsQuery: jest.Mocked<CustomerMetricsQuery>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetCustomerMetricsUseCase;

  const now = new Date(2026, 7, 6, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    customerMetricsQuery = {
      topCustomersByAppointments: jest.fn(),
      countActiveCustomers: jest.fn(),
      countInactiveCustomers: jest.fn(),
      findLastAppointmentByCustomer: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new GetCustomerMetricsUseCase(
      customerMetricsQuery,
      userRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns aggregated customer metrics without a last appointment when no customerId is given', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    customerMetricsQuery.topCustomersByAppointments.mockResolvedValue([
      { customerId: 'customer-1', customerName: 'Alice', total: 6 },
    ]);
    customerMetricsQuery.countActiveCustomers.mockResolvedValue(25);
    customerMetricsQuery.countInactiveCustomers.mockResolvedValue(4);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(result.metrics.activeCustomers).toBe(25);
    expect(result.metrics.inactiveCustomers).toBe(4);
    expect(result.lastAppointment).toBeUndefined();
    expect(
      customerMetricsQuery.findLastAppointmentByCustomer,
    ).not.toHaveBeenCalled();
  });

  it('includes the last appointment when a customerId is given', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    customerMetricsQuery.topCustomersByAppointments.mockResolvedValue([]);
    customerMetricsQuery.countActiveCustomers.mockResolvedValue(25);
    customerMetricsQuery.countInactiveCustomers.mockResolvedValue(4);
    customerMetricsQuery.findLastAppointmentByCustomer.mockResolvedValue({
      customerId: 'customer-1',
      customerName: 'Alice',
      lastAppointmentAt: new Date(2026, 6, 1),
    });

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
      customerId: 'customer-1',
    });

    expect(
      customerMetricsQuery.findLastAppointmentByCustomer,
    ).toHaveBeenCalledWith('customer-1');
    expect(result.lastAppointment?.customerId).toBe('customer-1');
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
    expect(
      customerMetricsQuery.topCustomersByAppointments,
    ).not.toHaveBeenCalled();
  });
});
