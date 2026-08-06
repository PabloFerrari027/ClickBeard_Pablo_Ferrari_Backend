import { Barber } from '../../../core/domain/entities/barber.entity';
import { Age } from '../../../core/domain/value-objects/age.value-object';
import { BarberModel, BarberModelAttributes } from '../models/barber.model';

export function toBarberPersistence(barber: Barber): BarberModelAttributes {
  return {
    id: barber.getId(),
    name: barber.getName(),
    age: barber.getAge().getValue(),
    hiredAt: barber.getHiredAt(),
    createdAt: barber.getCreatedAt(),
    updatedAt: barber.getUpdatedAt(),
  };
}

/** `qualificationIds` lives in a separate join table, so the caller resolves it first. */
export function toBarberDomain(
  model: BarberModel,
  qualificationIds: string[],
): Barber {
  return Barber.restore({
    id: model.id,
    name: model.name,
    age: Age.create(model.age),
    hiredAt: model.hiredAt,
    qualificationIds,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  });
}
