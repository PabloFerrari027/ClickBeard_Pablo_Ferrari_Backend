import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { TimeSlotDto } from '../dtos/time-slot.dto';

export function toTimeSlotDto(timeSlot: TimeSlot): TimeSlotDto {
  return {
    startAt: timeSlot.getStart(),
    endAt: timeSlot.getEnd(),
  };
}
