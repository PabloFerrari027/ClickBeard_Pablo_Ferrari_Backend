import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { PeriodPreset } from '../../domain/enums/period-preset.enum';
import { AppointmentMetricsQuery } from '../ports/appointment-metrics-query.port';
import { GetAppointmentMetricsUseCase } from './get-appointment-metrics.use-case';

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

describe('GetAppointmentMetricsUseCase', () => {
  let appointmentMetricsQuery: jest.Mocked<AppointmentMetricsQuery>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetAppointmentMetricsUseCase;

  const now = new Date(2026, 7, 6, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    appointmentMetricsQuery = {
      countTotal: jest.fn(),
      countInRange: jest.fn(),
      countUpcoming: jest.fn(),
      countCancelled: jest.fn(),
      cancellationRate: jest.fn(),
      mostUsedTimeSlots: jest.fn(),
      busiestDaysOfWeek: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new GetAppointmentMetricsUseCase(
      appointmentMetricsQuery,
      userRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns aggregated appointment metrics for an admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    appointmentMetricsQuery.countTotal.mockResolvedValue(100);
    appointmentMetricsQuery.countInRange.mockResolvedValue(10);
    appointmentMetricsQuery.countUpcoming.mockResolvedValue(20);
    appointmentMetricsQuery.countCancelled.mockResolvedValue(5);
    appointmentMetricsQuery.cancellationRate.mockResolvedValue(0.05);
    appointmentMetricsQuery.mostUsedTimeSlots.mockResolvedValue([
      { startTime: '10:00', total: 8 },
    ]);
    appointmentMetricsQuery.busiestDaysOfWeek.mockResolvedValue([
      { dayOfWeek: 5, total: 12 },
    ]);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      filter: { preset: PeriodPreset.MONTH },
    });

    expect(appointmentMetricsQuery.countInRange).toHaveBeenCalledTimes(4);
    expect(appointmentMetricsQuery.countUpcoming).toHaveBeenCalledWith(now);
    expect(result.metrics.totalAppointments).toBe(100);
    expect(result.metrics.futureAppointments).toBe(20);
    expect(result.metrics.cancellationRate).toBe(0.05);
    expect(result.metrics.mostUsedTimeSlots).toEqual([
      { startTime: '10:00', total: 8 },
    ]);
    expect(result.metrics.busiestDaysOfWeek).toEqual([
      { dayOfWeek: 5, total: 12 },
    ]);
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
    expect(appointmentMetricsQuery.countTotal).not.toHaveBeenCalled();
  });
});
