import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import {
  ListBarbersInputDto,
  ListBarbersOutputDto,
} from '../dtos/list-barbers.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';
import { Barber } from '../../domain/entities/barber.entity';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

export class ListBarbersUseCase implements UseCase<
  ListBarbersInputDto,
  ListBarbersOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
  ) {}

  async execute(input: ListBarbersInputDto): Promise<ListBarbersOutputDto> {
    const page = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;

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
      totalPages: Math.ceil(total / DEFAULT_LIMIT),
    };
  }
}
