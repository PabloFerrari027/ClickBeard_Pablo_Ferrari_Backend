import { User } from '../../domain/entities/user.entity';
import { UserDto } from '../dtos/user.dto';

export function toUserDto(user: User): UserDto {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail().getValue(),
    role: user.getRole(),
    birthDate: user.getBirthDate()?.getValue(),
    active: user.isActive(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt(),
  };
}
