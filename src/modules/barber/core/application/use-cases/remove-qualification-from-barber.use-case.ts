import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import {
  RemoveQualificationFromBarberInputDto,
  RemoveQualificationFromBarberOutputDto,
} from '../dtos/remove-qualification-from-barber.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberRepository } from '../ports/barber-repository.port';
import { UserDirectory } from '../ports/user-directory.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class RemoveQualificationFromBarberUseCase implements UseCase<
  RemoveQualificationFromBarberInputDto,
  RemoveQualificationFromBarberOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
    private readonly userDirectory: UserDirectory,
  ) {}

  async execute(
    input: RemoveQualificationFromBarberInputDto,
  ): Promise<RemoveQualificationFromBarberOutputDto> {
    await ensureRequesterIsAdmin(this.userDirectory, input.requesterId);

    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber) {
      throw new BarberNotFoundError();
    }

    barber.removeQualification(input.qualificationId);

    await this.barberRepository.save(barber);

    const qualifications = await this.qualificationRepository.listByBarberId(
      barber.getId(),
    );

    return { barber: toBarberDto(barber, qualifications) };
  }
}
