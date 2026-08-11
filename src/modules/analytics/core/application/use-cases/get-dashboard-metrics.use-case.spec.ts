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
      countTotal: jest.fn().mockResolvedValue(42),
      countByRole: jest.fn().mockResolvedValue([
        { role: UserRole.CLIENT, total: 30 },
        { role: UserRole.BARBER, total: 10 },
        { role: UserRole.ADMIN, total: 2 },
      ]),
      countActive: jest.fn().mockResolvedValue(40),
      countInactive: jest.fn().mockResolvedValue(2),
      countRegisteredInRange: jest.fn().mockResolvedValue(5),
      countPendingVerification: jest.fn().mockResolvedValue(3),
      countVerified: jest.fn().mockResolvedValue(39),
    };
    appointmentMetricsQuery = {
      countTotal: jest.fn().mockResolvedValue(100),
      countInRange: jest.fn().mockResolvedValue(10),
      countUpcoming: jest.fn().mockResolvedValue(20),
      countCancelled: jest.fn().mockResolvedValue(5),
      cancellationRate: jest.fn().mockResolvedValue(0.05),
      mostUsedTimeSlots: jest
        .fn()
        .mockResolvedValue([{ startTime: '10:00', total: 8 }]),
      busiestDaysOfWeek: jest
        .fn()
        .mockResolvedValue([{ dayOfWeek: 5, total: 12 }]),
    };
    barberMetricsQuery = {
      countTotal: jest.fn().mockResolvedValue(8),
      countAppointmentsByBarber: jest
        .fn()
        .mockResolvedValue([
          { barberId: 'barber-1', barberName: 'John', total: 15 },
        ]),
      mostRequestedBarbers: jest
        .fn()
        .mockResolvedValue([
          { barberId: 'barber-2', barberName: 'Alex', total: 9 },
        ]),
      mostUsedQualifications: jest
        .fn()
        .mockResolvedValue([
          { qualificationId: 'qual-1', qualificationName: 'Fade', total: 20 },
        ]),
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
      topCustomersByAppointments: jest
        .fn()
        .mockResolvedValue([
          { customerId: 'customer-1', customerName: 'Alice', total: 6 },
        ]),
      countActiveCustomers: jest.fn().mockResolvedValue(25),
      countInactiveCustomers: jest.fn().mockResolvedValue(4),
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

    expect(result.metrics).toEqual({
      users: {
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
      },
      appointments: {
        totalAppointments: 100,
        appointmentsToday: 10,
        appointmentsThisWeek: 10,
        appointmentsThisMonth: 10,
        appointmentsInPeriod: 10,
        futureAppointments: 20,
        cancelledAppointments: 5,
        cancellationRate: 0.05,
        mostUsedTimeSlots: [{ startTime: '10:00', total: 8 }],
        busiestDaysOfWeek: [{ dayOfWeek: 5, total: 12 }],
      },
      barbers: {
        totalBarbers: 8,
        appointmentsByBarber: [
          { barberId: 'barber-1', barberName: 'John', total: 15 },
        ],
        mostRequestedBarbers: [
          { barberId: 'barber-2', barberName: 'Alex', total: 9 },
        ],
        mostUsedQualifications: [
          { qualificationId: 'qual-1', qualificationName: 'Fade', total: 20 },
        ],
      },
      customers: {
        topCustomersByAppointments: [
          { customerId: 'customer-1', customerName: 'Alice', total: 6 },
        ],
        activeCustomers: 25,
        inactiveCustomers: 4,
      },
      occupation: {
        occupancyByBarber: [
          {
            barberId: 'barber-1',
            barberName: 'John',
            bookedSlots: 6,
            availableSlots: 10,
            occupancyRate: 0.6,
            freeTimeSlots: [],
          },
        ],
        averageOccupancyRate: 0.6,
      },
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
