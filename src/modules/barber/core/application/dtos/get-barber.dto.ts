import { BarberDto } from './barber.dto';

export interface GetBarberInputDto {
  barberId: string;
}

export interface GetBarberOutputDto {
  barber: BarberDto;
}
