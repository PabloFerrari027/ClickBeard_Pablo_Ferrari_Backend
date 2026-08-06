import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerLastAppointmentResponseDto {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiPropertyOptional({ nullable: true })
  lastAppointmentAt: Date | null;
}
