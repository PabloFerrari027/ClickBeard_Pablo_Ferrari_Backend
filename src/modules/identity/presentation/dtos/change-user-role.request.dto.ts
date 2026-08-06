import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { UserRole } from '../../core/domain/enums/user-role.enum';

export class ChangeUserRoleRequestDto {
  @ApiProperty({ enum: UserRole, example: UserRole.BARBER })
  @IsEnum(UserRole)
  role: UserRole;
}
