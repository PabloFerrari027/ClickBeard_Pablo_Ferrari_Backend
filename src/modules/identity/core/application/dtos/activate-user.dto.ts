import { UserDto } from './user.dto';

export interface ActivateUserInputDto {
  userId: string;
}

export interface ActivateUserOutputDto {
  user: UserDto;
}
