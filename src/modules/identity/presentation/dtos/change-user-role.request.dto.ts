import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { UserRole } from '../../core/domain/enums/user-role.enum';

export class ChangeUserRoleRequestDto {
  @ApiProperty({ enum: UserRole, example: UserRole.BARBER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description:
      'Id of the admin performing the request — required when role is ADMIN',
  })
  @IsOptional()
  @IsUUID()
  requesterId?: string;
}
