import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { AnalyticsFilterRequestDto } from './analytics-filter.request.dto';

export class GetCustomerMetricsRequestDto extends AnalyticsFilterRequestDto {
  @ApiPropertyOptional({
    description: "When provided, includes that customer's last appointment",
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
