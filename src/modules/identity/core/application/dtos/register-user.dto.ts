import { UserDto } from './user.dto';

export interface RegisterUserInputDto {
  name: string;
  email: string;
  password: string;
  birthDate?: string;
}

export interface RegisterUserOutputDto {
  user: UserDto;
}
