import { BarberDto } from './barber.dto';

export interface AddQualificationToBarberInputDto {
  requesterId: string;
  barberId: string;
  qualificationId: string;
}

export interface AddQualificationToBarberOutputDto {
  barber: BarberDto;
}
