import { ApiProperty } from '@nestjs/swagger';

import { BarberUnavailabilityResponseDto } from './barber-unavailability.response.dto';

export class ListBarberUnavailabilitiesResponseDto {
  @ApiProperty({ type: () => BarberUnavailabilityResponseDto, isArray: true })
  unavailabilities: BarberUnavailabilityResponseDto[];
}
