import { BarberDto } from './barber.dto';

export interface ListBarbersInputDto {
  page?: number;
}

export interface ListBarbersOutputDto {
  barbers: BarberDto[];
  page: number;
  totalPages: number;
}
