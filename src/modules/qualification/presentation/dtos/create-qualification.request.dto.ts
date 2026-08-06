import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQualificationRequestDto {
  @ApiProperty({ example: 'Beard Trim' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Trims and shapes beards' })
  @IsOptional()
  @IsString()
  description?: string;
}
