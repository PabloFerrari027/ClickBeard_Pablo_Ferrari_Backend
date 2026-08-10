import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { GetBarberInputDto, GetBarberOutputDto } from '../dtos/get-barber.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class GetBarberUseCase implements UseCase<
  GetBarberInputDto,
  GetBarberOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
  ) {}

  async execute(input: GetBarberInputDto): Promise<GetBarberOutputDto> {
    const barber = await this.barberRepository.findById(input.barberId);

    if (!barber || !barber.isActive()) {
      throw new BarberNotFoundError();
    }

    const qualifications = await this.qualificationRepository.listByBarberId(
      barber.getId(),
    );

    return { barber: toBarberDto(barber, qualifications) };
  }
}
