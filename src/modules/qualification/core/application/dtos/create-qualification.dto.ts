import { QualificationDto } from './qualification.dto';

export interface CreateQualificationInputDto {
  requesterId: string;
  name: string;
  description?: string;
}

export interface CreateQualificationOutputDto {
  qualification: QualificationDto;
}
