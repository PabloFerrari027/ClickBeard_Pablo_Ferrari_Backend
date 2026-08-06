import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateQualificationRequestDto {
  @ApiProperty({ description: 'Id of the admin performing the request' })
  @IsUUID()
  requesterId: string;

  @ApiProperty({ example: 'Beard Trim' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Trims and shapes beards' })
  @IsOptional()
  @IsString()
  description?: string;
}
