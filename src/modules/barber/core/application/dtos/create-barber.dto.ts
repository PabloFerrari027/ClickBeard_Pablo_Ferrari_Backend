import { BarberDto } from './barber.dto';

export interface CreateBarberInputDto {
  requesterId: string;
  userId: string;
  age: number;
  hiredAt: Date;
  qualificationIds: string[];
}

export interface CreateBarberOutputDto {
  barber: BarberDto;
}
