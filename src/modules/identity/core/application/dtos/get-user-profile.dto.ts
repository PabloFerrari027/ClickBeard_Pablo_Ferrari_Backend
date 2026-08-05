import { UserDto } from './user.dto';

export interface GetUserProfileInputDto {
  userId: string;
}

export interface GetUserProfileOutputDto {
  user: UserDto;
}
