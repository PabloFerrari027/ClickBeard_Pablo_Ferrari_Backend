import { UserDto } from './user.dto';

export interface DeactivateUserInputDto {
  userId: string;
}

export interface DeactivateUserOutputDto {
  user: UserDto;
}
