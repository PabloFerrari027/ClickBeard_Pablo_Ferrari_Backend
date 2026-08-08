import { BarberUnavailability } from '../../../core/domain/entities/barber-unavailability.entity';
import {
  BarberUnavailabilityModel,
  BarberUnavailabilityModelAttributes,
} from '../models/barber-unavailability.model';

export function toBarberUnavailabilityPersistence(
  unavailability: BarberUnavailability,
): BarberUnavailabilityModelAttributes {
  return {
    id: unavailability.getId(),
    barberId: unavailability.getBarberId(),
    startAt: unavailability.getStartAt(),
    endAt: unavailability.getEndAt(),
    reason: unavailability.getReason(),
    createdAt: unavailability.getCreatedAt(),
  };
}

export function toBarberUnavailabilityDomain(
  model: BarberUnavailabilityModel,
): BarberUnavailability {
  return BarberUnavailability.restore({
    id: model.id,
    barberId: model.barberId,
    startAt: model.startAt,
    endAt: model.endAt,
    reason: model.reason,
    createdAt: model.createdAt,
  });
}
