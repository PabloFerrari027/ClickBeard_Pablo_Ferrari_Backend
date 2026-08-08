import { UserDto } from './user.dto';

export interface UpdateUserProfileInputDto {
  userId: string;
  name?: string;
  birthDate?: string;
}

export interface UpdateUserProfileOutputDto {
  user: UserDto;
}
