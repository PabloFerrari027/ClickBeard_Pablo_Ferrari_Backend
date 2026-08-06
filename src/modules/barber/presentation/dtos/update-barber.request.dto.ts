import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateBarberRequestDto {
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  age?: number;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  hiredAt?: string;
}
