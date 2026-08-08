import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { QualificationInUseError } from '../../domain/errors/qualification-in-use.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import { BarberRepository } from '../../../../barber/core/application/ports/barber-repository.port';
import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { DeleteQualificationUseCase } from './delete-qualification.use-case';

function buildAdmin(role: UserRole = UserRole.ADMIN): User {
  return User.restore({
    id: 'admin-id',
    name: 'Admin User',
    email: Email.create('admin-id@example.com'),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('DeleteQualificationUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let barberRepository: jest.Mocked<BarberRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: DeleteQualificationUseCase;

  beforeEach(() => {
    qualificationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      listByBarberId: jest.fn(),
      delete: jest.fn(),
    };
    barberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByQualificationId: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new DeleteQualificationUseCase(
      qualificationRepository,
      barberRepository,
      userRepository,
    );
  });

  it('deletes the qualification when it is not in use', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );
    barberRepository.existsByQualificationId.mockResolvedValue(false);

    await useCase.execute({
      requesterId: 'admin-id',
      qualificationId: 'qualification-id',
    });

    expect(qualificationRepository.delete).toHaveBeenCalledWith(
      'qualification-id',
    );
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin(UserRole.BARBER));

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'qualification-id',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(qualificationRepository.delete).not.toHaveBeenCalled();
  });

  it('throws QualificationNotFoundError when the qualification does not exist', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'missing-id',
      }),
    ).rejects.toThrow(QualificationNotFoundError);
    expect(qualificationRepository.delete).not.toHaveBeenCalled();
  });

  it('throws QualificationInUseError when a barber is assigned to the qualification', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );
    barberRepository.existsByQualificationId.mockResolvedValue(true);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'qualification-id',
      }),
    ).rejects.toThrow(QualificationInUseError);
    expect(qualificationRepository.delete).not.toHaveBeenCalled();
  });
});
