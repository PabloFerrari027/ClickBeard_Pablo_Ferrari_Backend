import { ApiProperty } from '@nestjs/swagger';

import { BarberAppointmentCountResponseDto } from './barber-appointment-count.response.dto';
import { QualificationUsageCountResponseDto } from './qualification-usage-count.response.dto';

export class BarberMetricsResponseDto {
  @ApiProperty()
  totalBarbers: number;

  @ApiProperty({
    type: () => BarberAppointmentCountResponseDto,
    isArray: true,
  })
  appointmentsByBarber: BarberAppointmentCountResponseDto[];

  @ApiProperty({
    type: () => BarberAppointmentCountResponseDto,
    isArray: true,
  })
  mostRequestedBarbers: BarberAppointmentCountResponseDto[];

  @ApiProperty({
    type: () => QualificationUsageCountResponseDto,
    isArray: true,
  })
  mostUsedQualifications: QualificationUsageCountResponseDto[];
}
