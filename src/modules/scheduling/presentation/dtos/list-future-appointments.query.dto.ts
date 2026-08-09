import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ListFutureAppointmentsQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({
    description:
      'Only include appointments starting at or after this instant (still bounded below by "now")',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({
    description: 'Only include appointments starting at or before this instant',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
