import { BarberDto } from './barber.dto';

export interface RemoveQualificationFromBarberInputDto {
  requesterId: string;
  barberId: string;
  qualificationId: string;
}

export interface RemoveQualificationFromBarberOutputDto {
  barber: BarberDto;
}
