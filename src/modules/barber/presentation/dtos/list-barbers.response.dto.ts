import { ApiProperty } from '@nestjs/swagger';

import { BarberResponseDto } from './barber.response.dto';

export class ListBarbersResponseDto {
  @ApiProperty({ type: () => BarberResponseDto, isArray: true })
  barbers: BarberResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}
