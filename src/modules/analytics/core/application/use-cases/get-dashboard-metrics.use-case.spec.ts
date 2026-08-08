import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { AppointmentMetricsQuery } from '../ports/appointment-metrics-query.port';
import { BarberMetricsQuery } from '../ports/barber-metrics-query.port';
import { CustomerMetricsQuery } from '../ports/customer-metrics-query.port';
import { UserMetricsQuery } from '../ports/user-metrics-query.port';
import { GetDashboardMetricsUseCase } from './get-dashboard-metrics.use-case';

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

describe('GetDashboardMetricsUseCase', () => {
  let userMetricsQuery: jest.Mocked<UserMetricsQuery>;
  let appointmentMetricsQuery: jest.Mocked<AppointmentMetricsQuery>;
  let barberMetricsQuery: jest.Mocked<BarberMetricsQuery>;
  let customerMetricsQuery: jest.Mocked<CustomerMetricsQuery>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetDashboardMetricsUseCase;

  const now = new Date(2026, 7, 6, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    userMetricsQuery = {
      countTotal: jest.fn().mockResolvedValue(0),
      countByRole: jest.fn().mockResolvedValue([]),
      countActive: jest.fn().mockResolvedValue(0),
      countInactive: jest.fn().mockResolvedValue(0),
      countRegisteredInRange: jest.fn().mockResolvedValue(0),
      countPendingVerification: jest.fn().mockResolvedValue(0),
      countVerified: jest.fn().mockResolvedValue(0),
    };
    appointmentMetricsQuery = {
      countTotal: jest.fn().mockResolvedValue(0),
      countInRange: jest.fn().mockResolvedValue(0),
      countUpcoming: jest.fn().mockResolvedValue(0),
      countCancelled: jest.fn().mockResolvedValue(0),
      cancellationRate: jest.fn().mockResolvedValue(0),
      mostUsedTimeSlots: jest.fn().mockResolvedValue([]),
      busiestDaysOfWeek: jest.fn().mockResolvedValue([]),
    };
    barberMetricsQuery = {
      countTotal: jest.fn().mockResolvedValue(0),
      countAppointmentsByBarber: jest.fn().mockResolvedValue([]),
      mostRequestedBarbers: jest.fn().mockResolvedValue([]),
      mostUsedQualifications: jest.fn().mockResolvedValue([]),
      occupancyByBarber: jest.fn().mockResolvedValue([
        {
          barberId: 'barber-1',
          barberName: 'John',
          bookedSlots: 6,
          availableSlots: 10,
          occupancyRate: 0.6,
          freeTimeSlots: [],
        },
      ]),
    };
    customerMetricsQuery = {
      topCustomersByAppointments: jest.fn().mockResolvedValue([]),
      countActiveCustomers: jest.fn().mockResolvedValue(0),
      countInactiveCustomers: jest.fn().mockResolvedValue(0),
      findLastAppointmentByCustomer: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new GetDashboardMetricsUseCase(
      userMetricsQuery,
      appointmentMetricsQuery,
      barberMetricsQuery,
      customerMetricsQuery,
      userRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('composes every section of the dashboard for an admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(result.metrics.users).toBeDefined();
    expect(result.metrics.appointments).toBeDefined();
    expect(result.metrics.barbers).toBeDefined();
    expect(result.metrics.customers).toBeDefined();
    expect(result.metrics.occupation.averageOccupancyRate).toBe(0.6);
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
