import { BarberRoleChangeNotAllowedError } from '../../domain/errors/barber-role-change-not-allowed.error';
import { InvalidUserRoleError } from '../../domain/errors/invalid-user-role.error';
import { SameUserRoleError } from '../../domain/errors/same-user-role.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRoleChangedEvent } from '../../domain/events/user-role-changed.event';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRepository } from '../ports/user-repository.port';
import { ChangeUserRoleUseCase } from './change-user-role.use-case';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';

describe('ChangeUserRoleUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: ChangeUserRoleUseCase;

  function buildUser(role: UserRole = UserRole.CLIENT, id = 'user-id'): User {
    return User.restore({
      id,
      name: 'Jane Doe',
      email: Email.create(`${id}@example.com`),
      password: Password.fromHash('hashed-password'),
      role,
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  }

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new ChangeUserRoleUseCase(userRepository, eventBus);
  });

  it('changes the role from BARBER back to CLIENT, returns the updated user dto, and publishes UserRoleChangedEvent', async () => {
    const user = buildUser(UserRole.BARBER);
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({
      userId: 'user-id',
      role: UserRole.CLIENT,
    });

    expect(user.getRole()).toBe(UserRole.CLIENT);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(result.user.role).toBe(UserRole.CLIENT);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(UserRoleChangedEvent),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          userId: 'user-id',
          previousRole: UserRole.BARBER,
          newRole: UserRole.CLIENT,
        },
      }),
    );
  });

  it('throws BarberRoleChangeNotAllowedError when the target role is BARBER', async () => {
    await expect(
      useCase.execute({ userId: 'user-id', role: UserRole.BARBER }),
    ).rejects.toThrow(BarberRoleChangeNotAllowedError);

    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws InvalidUserRoleError when the role is not a known UserRole', async () => {
    await expect(
      useCase.execute({ userId: 'user-id', role: 'OWNER' as UserRole }),
    ).rejects.toThrow(InvalidUserRoleError);

    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'missing-id', role: UserRole.CLIENT }),
    ).rejects.toThrow(UserNotFoundError);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('propagates SameUserRoleError when the new role matches the current one', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.CLIENT));

    await expect(
      useCase.execute({ userId: 'user-id', role: UserRole.CLIENT }),
    ).rejects.toThrow(SameUserRoleError);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('promotes a user to ADMIN when requested by an existing admin', async () => {
    userRepository.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildUser(UserRole.ADMIN, 'admin-id')
          : buildUser(UserRole.CLIENT, 'user-id'),
      ),
    );

    const result = await useCase.execute({
      userId: 'user-id',
      role: UserRole.ADMIN,
      requesterId: 'admin-id',
    });

    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(userRepository.save).toHaveBeenCalled();
  });

  it('throws UserNotFoundError when promoting to ADMIN without a requesterId', async () => {
    await expect(
      useCase.execute({ userId: 'user-id', role: UserRole.ADMIN }),
    ).rejects.toThrow(UserNotFoundError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser(UserRole.CLIENT, 'requester-id'),
    );

    await expect(
      useCase.execute({
        userId: 'user-id',
        role: UserRole.ADMIN,
        requesterId: 'requester-id',
      }),
    ).rejects.toThrow(UserIsNotAdminError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
