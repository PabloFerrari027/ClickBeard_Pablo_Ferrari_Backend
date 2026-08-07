import { BarberUnavailabilityDto } from './barber-unavailability.dto';

export interface CreateBarberUnavailabilityInputDto {
  requesterId: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
}

export interface CreateBarberUnavailabilityOutputDto {
  unavailability: BarberUnavailabilityDto;
}
