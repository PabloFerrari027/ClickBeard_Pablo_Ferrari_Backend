import { QualificationDto } from './qualification.dto';

export interface UpdateQualificationInputDto {
  requesterId: string;
  qualificationId: string;
  name?: string;
  description?: string;
}

export interface UpdateQualificationOutputDto {
  qualification: QualificationDto;
}
