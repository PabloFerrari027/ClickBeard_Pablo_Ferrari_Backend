import { ApiProperty } from '@nestjs/swagger';

export class CustomerAppointmentCountResponseDto {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  total: number;
}
