import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { BarberUnavailabilityOverlapError } from '../../domain/errors/barber-unavailability-overlap.error';
import { BarberUnavailability } from '../../domain/entities/barber-unavailability.entity';
import { BarberUnavailabilityCreatedEvent } from '../../domain/events/barber-unavailability-created.event';
import {
  CreateBarberUnavailabilityInputDto,
  CreateBarberUnavailabilityOutputDto,
} from '../dtos/create-barber-unavailability.dto';
import { toBarberUnavailabilityDto } from '../mappers/barber-unavailability.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberUnavailabilityRepository } from '../ports/barber-unavailability-repository.port';
import { BarberRepository } from '../ports/barber-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CreateBarberUnavailabilityUseCase implements UseCase<
  CreateBarberUnavailabilityInputDto,
  CreateBarberUnavailabilityOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly unavailabilityRepository: BarberUnavailabilityRepository,
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    input: CreateBarberUnavailabilityInputDto,
  ): Promise<CreateBarberUnavailabilityOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber) {
      throw new BarberNotFoundError();
    }

    const overlaps = await this.unavailabilityRepository.existsOverlapping(
      input.barberId,
      input.startAt,
      input.endAt,
    );

    if (overlaps) {
      throw new BarberUnavailabilityOverlapError();
    }

    const now = new Date();

    const unavailability = BarberUnavailability.create({
      barberId: input.barberId,
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason,
      now,
    });

    await this.unavailabilityRepository.save(unavailability);

    await this.eventBus.publish(
      new BarberUnavailabilityCreatedEvent(
        {
          unavailabilityId: unavailability.getId(),
          barberId: unavailability.getBarberId(),
          startAt: unavailability.getStartAt().toISOString(),
          endAt: unavailability.getEndAt().toISOString(),
          reason: unavailability.getReason(),
        },
        now,
      ),
    );

    return { unavailability: toBarberUnavailabilityDto(unavailability) };
  }
}
