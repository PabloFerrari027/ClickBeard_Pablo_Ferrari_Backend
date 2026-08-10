import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { UserRole } from '../../core/domain/enums/user-role.enum';

export class ChangeUserRoleRequestDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description:
      'Target role. BARBER cannot be assigned here — create a barber profile via POST /barbers instead, which promotes the user automatically.',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
