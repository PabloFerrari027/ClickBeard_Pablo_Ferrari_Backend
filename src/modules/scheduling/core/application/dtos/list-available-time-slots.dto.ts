import { TimeSlotDto } from './time-slot.dto';

export interface ListAvailableTimeSlotsInputDto {
  barberId: string;
  qualificationId: string;
  date: Date;
}

export interface ListAvailableTimeSlotsOutputDto {
  timeSlots: TimeSlotDto[];
}
