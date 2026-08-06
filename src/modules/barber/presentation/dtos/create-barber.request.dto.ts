import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsDateString,
  IsInt,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateBarberRequestDto {
  @ApiProperty({ description: 'Id of the identity user becoming a barber' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  hiredAt: string;

  @ApiProperty({ type: [String] })
  @IsUUID('4', { each: true })
  @ArrayNotEmpty()
  qualificationIds: string[];
}
