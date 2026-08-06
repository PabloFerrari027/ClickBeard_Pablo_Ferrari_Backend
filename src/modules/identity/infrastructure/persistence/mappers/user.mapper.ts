import { User } from '../../../core/domain/entities/user.entity';
import { Email } from '../../../core/domain/value-objects/email.value-object';
import { Password } from '../../../core/domain/value-objects/password.value-object';
import { UserModel, UserModelAttributes } from '../models/user.model';

export function toUserPersistence(user: User): UserModelAttributes {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail().getValue(),
    passwordHash: user.getPassword().getHash(),
    role: user.getRole(),
    active: user.isActive(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt(),
  };
}

export function toUserDomain(model: UserModel): User {
  return User.restore({
    id: model.id,
    name: model.name,
    email: Email.create(model.email),
    password: Password.fromHash(model.passwordHash),
    role: model.role,
    active: model.active,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  });
}
