import { UserDto } from './user.dto';

export interface AuthenticateUserInputDto {
  email: string;
  password: string;
}

export interface AuthenticateUserOutputDto {
  user: UserDto;
}
