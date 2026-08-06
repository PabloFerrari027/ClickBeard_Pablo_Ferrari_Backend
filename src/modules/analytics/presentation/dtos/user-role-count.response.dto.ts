import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';

export class UserRoleCountResponseDto {
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  total: number;
}
