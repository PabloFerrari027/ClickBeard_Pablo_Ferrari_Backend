import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { Age } from '../../domain/value-objects/age.value-object';
import {
  UpdateBarberInputDto,
  UpdateBarberOutputDto,
} from '../dtos/update-barber.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class UpdateBarberUseCase implements UseCase<
  UpdateBarberInputDto,
  UpdateBarberOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
  ) {}

  async execute(input: UpdateBarberInputDto): Promise<UpdateBarberOutputDto> {
    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber) {
      throw new BarberNotFoundError();
    }

    if (input.age !== undefined) {
      barber.updateAge(Age.create(input.age));
    }

    if (input.hiredAt !== undefined) {
      barber.updateHiredAt(input.hiredAt);
    }

    await this.barberRepository.save(barber);

    const qualifications = await this.qualificationRepository.listByBarberId(
      barber.getId(),
    );

    return { barber: toBarberDto(barber, qualifications) };
  }
}
