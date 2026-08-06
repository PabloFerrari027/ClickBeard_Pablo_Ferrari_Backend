import { ApiProperty } from '@nestjs/swagger';

import { UserRoleCountResponseDto } from './user-role-count.response.dto';

export class UserMetricsResponseDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty({ type: () => UserRoleCountResponseDto, isArray: true })
  totalByRole: UserRoleCountResponseDto[];

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  inactiveUsers: number;

  @ApiProperty()
  newUsersInPeriod: number;

  @ApiProperty()
  pendingVerification: number;

  @ApiProperty()
  verifiedAccounts: number;
}
