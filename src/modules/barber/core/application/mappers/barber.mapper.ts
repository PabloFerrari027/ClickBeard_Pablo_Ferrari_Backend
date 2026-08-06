import { toQualificationDto } from '../../../../qualification/core/application/mappers/qualification.mapper';
import { Qualification } from '../../../../qualification/core/domain/entities/qualification.entity';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberDto } from '../dtos/barber.dto';

export function toBarberDto(
  barber: Barber,
  qualifications: Qualification[],
): BarberDto {
  return {
    id: barber.getId(),
    userId: barber.getId(),
    name: barber.getName(),
    age: barber.getAge().getValue(),
    hiredAt: barber.getHiredAt(),
    qualifications: qualifications.map(toQualificationDto),
    createdAt: barber.getCreatedAt(),
    updatedAt: barber.getUpdatedAt(),
  };
}
