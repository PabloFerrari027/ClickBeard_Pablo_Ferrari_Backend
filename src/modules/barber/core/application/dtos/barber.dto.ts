import { QualificationDto } from '../../../../qualification/core/application/dtos/qualification.dto';

export interface BarberDto {
  id: string;
  userId: string;
  name: string;
  age: number;
  hiredAt: Date;
  qualifications: QualificationDto[];
  createdAt: Date;
  updatedAt: Date;
}
