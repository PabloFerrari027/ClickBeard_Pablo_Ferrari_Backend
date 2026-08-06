import { ApiProperty } from '@nestjs/swagger';

import { AppointmentResponseDto } from './appointment.response.dto';

export class ListAppointmentsResponseDto {
  @ApiProperty({ type: () => AppointmentResponseDto, isArray: true })
  appointments: AppointmentResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}
