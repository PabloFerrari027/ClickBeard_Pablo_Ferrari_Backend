import { BarberUnavailabilityDto } from './barber-unavailability.dto';

export interface ListBarberUnavailabilitiesInputDto {
  requesterId: string;
  barberId: string;
}

export interface ListBarberUnavailabilitiesOutputDto {
  unavailabilities: BarberUnavailabilityDto[];
}
