import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from './user.response.dto';

export class ListUsersResponseDto {
  @ApiProperty({ type: () => UserResponseDto, isArray: true })
  users: UserResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}
