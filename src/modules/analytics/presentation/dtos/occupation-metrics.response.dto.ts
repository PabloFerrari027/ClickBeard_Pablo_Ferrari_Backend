import { ApiProperty } from '@nestjs/swagger';

import { BarberOccupationResponseDto } from './barber-occupation.response.dto';

export class OccupationMetricsResponseDto {
  @ApiProperty({ type: () => BarberOccupationResponseDto, isArray: true })
  occupancyByBarber: BarberOccupationResponseDto[];

  @ApiProperty({
    description: 'Mean of occupancyByBarber[].occupancyRate, as a 0..1 ratio',
  })
  averageOccupancyRate: number;
}
