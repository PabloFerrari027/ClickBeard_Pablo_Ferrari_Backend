import { UserDto } from './user.dto';

export interface ListUsersInputDto {
  page?: number;
}

export interface ListUsersOutputDto {
  users: UserDto[];
  page: number;
  totalPages: number;
}
