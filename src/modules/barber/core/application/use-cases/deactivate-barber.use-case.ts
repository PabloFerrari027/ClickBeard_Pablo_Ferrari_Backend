import { DeactivateBarberInputDto } from '../dtos/deactivate-barber.dto';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

/**
 * Runs off the `UserRoleChanged` domain event (see
 * `UserRoleChangedConsumer`), not an HTTP request — must never throw, or
 * an unhandled rejection would crash/retry-loop the queue worker for a
 * condition (barber row missing or already inactive) that isn't an error.
 */
export class DeactivateBarberUseCase implements UseCase<
  DeactivateBarberInputDto,
  void
> {
  constructor(private readonly barberRepository: BarberRepository) {}

  async execute(input: DeactivateBarberInputDto): Promise<void> {
    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber || !barber.isActive()) {
      return;
    }

    barber.deactivate();

    await this.barberRepository.save(barber);
  }
}
