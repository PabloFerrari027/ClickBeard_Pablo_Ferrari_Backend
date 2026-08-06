import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

import { PeriodPreset } from '../../core/domain/enums/period-preset.enum';

export class AnalyticsFilterRequestDto {
  @ApiProperty({ enum: PeriodPreset, example: PeriodPreset.MONTH })
  @IsEnum(PeriodPreset)
  preset: PeriodPreset;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2026-01-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
