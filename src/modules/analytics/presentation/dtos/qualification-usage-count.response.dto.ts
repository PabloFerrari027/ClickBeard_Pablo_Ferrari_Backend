import { ApiProperty } from '@nestjs/swagger';

export class QualificationUsageCountResponseDto {
  @ApiProperty()
  qualificationId: string;

  @ApiProperty()
  qualificationName: string;

  @ApiProperty()
  total: number;
}
