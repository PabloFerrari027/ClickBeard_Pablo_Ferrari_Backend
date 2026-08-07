import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import {
  ListBarberUnavailabilitiesInputDto,
  ListBarberUnavailabilitiesOutputDto,
} from '../dtos/list-barber-unavailabilities.dto';
import { toBarberUnavailabilityDto } from '../mappers/barber-unavailability.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberUnavailabilityRepository } from '../ports/barber-unavailability-repository.port';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListBarberUnavailabilitiesUseCase implements UseCase<
  ListBarberUnavailabilitiesInputDto,
  ListBarberUnavailabilitiesOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly unavailabilityRepository: BarberUnavailabilityRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListBarberUnavailabilitiesInputDto,
  ): Promise<ListBarberUnavailabilitiesOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber) {
      throw new BarberNotFoundError();
    }

    const unavailabilities = await this.unavailabilityRepository.listByBarberId(
      input.barberId,
    );

    return {
      unavailabilities: unavailabilities.map(toBarberUnavailabilityDto),
    };
  }
}
