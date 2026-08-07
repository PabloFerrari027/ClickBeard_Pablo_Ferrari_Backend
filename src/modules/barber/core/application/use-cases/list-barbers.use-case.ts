import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import {
  ListBarbersInputDto,
  ListBarbersOutputDto,
} from '../dtos/list-barbers.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { BarberRepository } from '../ports/barber-repository.port';
import {
  computeTotalPages,
  DEFAULT_LIMIT,
  resolvePage,
} from '../../../../../shared/application/pagination';
import { UseCase } from '../../../../../shared/application/use-case';
import { Barber } from '../../domain/entities/barber.entity';

export class ListBarbersUseCase implements UseCase<
  ListBarbersInputDto,
  ListBarbersOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
  ) {}

  async execute(input: ListBarbersInputDto): Promise<ListBarbersOutputDto> {
    const page = resolvePage(input.page);

    const { barbers, total } = await this.barberRepository.findAll(
      page,
      DEFAULT_LIMIT,
    );

    const barberDtos = await Promise.all(
      barbers.map(async (barber: Barber) => {
        const qualifications =
          await this.qualificationRepository.listByBarberId(barber.getId());

        return toBarberDto(barber, qualifications);
      }),
    );

    return {
      barbers: barberDtos,
      page,
      totalPages: computeTotalPages(total),
    };
  }
}
