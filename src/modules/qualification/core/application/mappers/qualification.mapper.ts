import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationDto } from '../dtos/qualification.dto';

export function toQualificationDto(
  qualification: Qualification,
): QualificationDto {
  return {
    id: qualification.getId(),
    name: qualification.getName(),
    description: qualification.getDescription(),
    createdAt: qualification.getCreatedAt(),
    updatedAt: qualification.getUpdatedAt(),
  };
}
