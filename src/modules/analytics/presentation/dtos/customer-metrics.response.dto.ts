import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CustomerAppointmentCountResponseDto } from './customer-appointment-count.response.dto';
import { CustomerLastAppointmentResponseDto } from './customer-last-appointment.response.dto';

export class CustomerMetricsResponseDto {
  @ApiProperty({
    type: () => CustomerAppointmentCountResponseDto,
    isArray: true,
  })
  topCustomersByAppointments: CustomerAppointmentCountResponseDto[];

  @ApiProperty()
  activeCustomers: number;

  @ApiProperty()
  inactiveCustomers: number;

  @ApiPropertyOptional({
    type: () => CustomerLastAppointmentResponseDto,
    nullable: true,
  })
  lastAppointment?: CustomerLastAppointmentResponseDto | null;
}
