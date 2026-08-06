import { ApiProperty } from '@nestjs/swagger';

import { QualificationResponseDto } from '../../../qualification/presentation/dtos/qualification.response.dto';

export class BarberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  hiredAt: Date;

  @ApiProperty({ type: () => QualificationResponseDto, isArray: true })
  qualifications: QualificationResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
