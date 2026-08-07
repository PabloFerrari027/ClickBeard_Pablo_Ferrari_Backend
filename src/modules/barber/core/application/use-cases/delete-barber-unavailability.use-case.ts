import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { BarberUnavailabilityNotFoundError } from '../../domain/errors/barber-unavailability-not-found.error';
import { DeleteBarberUnavailabilityInputDto } from '../dtos/delete-barber-unavailability.dto';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberUnavailabilityRepository } from '../ports/barber-unavailability-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class DeleteBarberUnavailabilityUseCase implements UseCase<
  DeleteBarberUnavailabilityInputDto,
  void
> {
  constructor(
    private readonly unavailabilityRepository: BarberUnavailabilityRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: DeleteBarberUnavailabilityInputDto): Promise<void> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const unavailability = await this.unavailabilityRepository.findById(
      input.unavailabilityId,
    );

    if (!unavailability || unavailability.getBarberId() !== input.barberId) {
      throw new BarberUnavailabilityNotFoundError();
    }

    await this.unavailabilityRepository.delete(input.unavailabilityId);
  }
}
