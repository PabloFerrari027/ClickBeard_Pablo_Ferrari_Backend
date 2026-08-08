import { BarberUnavailability } from '../../domain/entities/barber-unavailability.entity';
import { BarberUnavailabilityDto } from '../dtos/barber-unavailability.dto';

export function toBarberUnavailabilityDto(
  unavailability: BarberUnavailability,
): BarberUnavailabilityDto {
  return {
    id: unavailability.getId(),
    barberId: unavailability.getBarberId(),
    startAt: unavailability.getStartAt(),
    endAt: unavailability.getEndAt(),
    reason: unavailability.getReason(),
    createdAt: unavailability.getCreatedAt(),
  };
}
