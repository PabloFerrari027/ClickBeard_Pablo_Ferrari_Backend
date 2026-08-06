import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { QualificationNotFoundError } from '../../../../qualification/core/domain/errors/qualification-not-found.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import {
  AddQualificationToBarberInputDto,
  AddQualificationToBarberOutputDto,
} from '../dtos/add-qualification-to-barber.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class AddQualificationToBarberUseCase implements UseCase<
  AddQualificationToBarberInputDto,
  AddQualificationToBarberOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: AddQualificationToBarberInputDto,
  ): Promise<AddQualificationToBarberOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber) {
      throw new BarberNotFoundError();
    }

    const qualification = await this.qualificationRepository.findById(
      input.qualificationId,
    );

    if (!qualification) {
      throw new QualificationNotFoundError();
    }

    barber.addQualification(input.qualificationId);

    await this.barberRepository.save(barber);

    const qualifications = await this.qualificationRepository.listByBarberId(
      barber.getId(),
    );

    return { barber: toBarberDto(barber, qualifications) };
  }
}
