import { BarberDto } from './barber.dto';

export interface UpdateBarberInputDto {
  barberId: string;
  age?: number;
  hiredAt?: Date;
}

export interface UpdateBarberOutputDto {
  barber: BarberDto;
}
