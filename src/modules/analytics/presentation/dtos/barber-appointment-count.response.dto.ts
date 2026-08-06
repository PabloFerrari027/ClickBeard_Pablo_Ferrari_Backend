import { ApiProperty } from '@nestjs/swagger';

export class BarberAppointmentCountResponseDto {
  @ApiProperty()
  barberId: string;

  @ApiProperty()
  barberName: string;

  @ApiProperty()
  total: number;
}
