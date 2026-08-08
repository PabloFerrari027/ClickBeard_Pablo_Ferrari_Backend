import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { BarberUnavailabilityNotFoundError } from '../../domain/errors/barber-unavailability-not-found.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { BarberUnavailability } from '../../domain/entities/barber-unavailability.entity';
import { BarberUnavailabilityRepository } from '../ports/barber-unavailability-repository.port';
import { DeleteBarberUnavailabilityUseCase } from './delete-barber-unavailability.use-case';

function buildUser(role: UserRole): User {
  return User.restore({
    id: 'admin-id',
    name: 'Admin',
    email: Email.create('admin-id@example.com'),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildUnavailability(barberId = 'barber-id'): BarberUnavailability {
  return BarberUnavailability.create({
    barberId,
    startAt: new Date('2026-08-10T00:00:00.000Z'),
    endAt: new Date('2026-08-12T00:00:00.000Z'),
    reason: 'Sick leave',
    now: new Date('2026-08-01T00:00:00.000Z'),
  });
}

describe('DeleteBarberUnavailabilityUseCase', () => {
  let unavailabilityRepository: jest.Mocked<BarberUnavailabilityRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: DeleteBarberUnavailabilityUseCase;

  beforeEach(() => {
    unavailabilityRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      listByBarberId: jest.fn(),
      existsOverlapping: jest.fn(),
      delete: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new DeleteBarberUnavailabilityUseCase(
      unavailabilityRepository,
      userRepository,
    );
  });

  it('deletes the unavailability period when it belongs to the barber', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.ADMIN));
    const unavailability = buildUnavailability();
    unavailabilityRepository.findById.mockResolvedValue(unavailability);

    await useCase.execute({
      requesterId: 'admin-id',
      barberId: 'barber-id',
      unavailabilityId: unavailability.getId(),
    });

    expect(unavailabilityRepository.delete).toHaveBeenCalledWith(
      unavailability.getId(),
    );
  });

  it('throws UserIsNotAdminError for a non-admin requester', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.CLIENT));

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        unavailabilityId: 'unavailability-id',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
  });

  it('throws BarberUnavailabilityNotFoundError when it does not exist', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.ADMIN));
    unavailabilityRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        unavailabilityId: 'missing-id',
      }),
    ).rejects.toThrow(BarberUnavailabilityNotFoundError);
  });

  it('throws BarberUnavailabilityNotFoundError when it belongs to a different barber', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.ADMIN));
    unavailabilityRepository.findById.mockResolvedValue(
      buildUnavailability('other-barber-id'),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        unavailabilityId: 'unavailability-id',
      }),
    ).rejects.toThrow(BarberUnavailabilityNotFoundError);
    expect(unavailabilityRepository.delete).not.toHaveBeenCalled();
  });
});
