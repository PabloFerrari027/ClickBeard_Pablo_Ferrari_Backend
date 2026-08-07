import { BarberDoesNotHaveQualificationError } from '../../domain/errors/barber-does-not-have-qualification.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import {
  ListAvailableTimeSlotsInputDto,
  ListAvailableTimeSlotsOutputDto,
} from '../dtos/list-available-time-slots.dto';
import { toTimeSlotDto } from '../mappers/time-slot.mapper';
import { AvailabilityService } from '../ports/availability-service.port';
import { BarberDirectory } from '../ports/barber-directory.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListAvailableTimeSlotsUseCase implements UseCase<
  ListAvailableTimeSlotsInputDto,
  ListAvailableTimeSlotsOutputDto
> {
  constructor(
    private readonly barberDirectory: BarberDirectory,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(
    input: ListAvailableTimeSlotsInputDto,
  ): Promise<ListAvailableTimeSlotsOutputDto> {
    const barber = await this.barberDirectory.findById(input.barberId);

    if (!barber || !barber.active) {
      throw new BarberNotFoundError();
    }

    if (!barber.qualificationIds.includes(input.qualificationId)) {
      throw new BarberDoesNotHaveQualificationError();
    }

    const bookedSlots = await this.availabilityService.getBookedSlots(
      input.barberId,
      input.date,
    );
    const now = new Date();

    const availableSlots = TimeSlot.allForDate(input.date).filter(
      (slot) =>
        slot.getStart().getTime() >= now.getTime() &&
        !bookedSlots.some((booked) => booked.equals(slot)),
    );

    return { timeSlots: availableSlots.map(toTimeSlotDto) };
  }
}
