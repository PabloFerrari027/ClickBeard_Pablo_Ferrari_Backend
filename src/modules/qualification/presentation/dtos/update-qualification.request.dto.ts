import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateQualificationRequestDto {
  @ApiPropertyOptional({
    description: 'Id of the admin performing the request',
  })
  @IsUUID()
  requesterId: string;

  @ApiPropertyOptional({ example: 'Fade Cut' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}
