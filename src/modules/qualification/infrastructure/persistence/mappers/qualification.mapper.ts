import { Qualification } from '../../../core/domain/entities/qualification.entity';
import {
  QualificationModel,
  QualificationModelAttributes,
} from '../models/qualification.model';

export function toQualificationPersistence(
  qualification: Qualification,
): QualificationModelAttributes {
  return {
    id: qualification.getId(),
    name: qualification.getName(),
    description: qualification.getDescription() ?? null,
    createdAt: qualification.getCreatedAt(),
    updatedAt: qualification.getUpdatedAt(),
  };
}

export function toQualificationDomain(
  model: QualificationModel,
): Qualification {
  return Qualification.restore({
    id: model.id,
    name: model.name,
    description: model.description ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  });
}
