import { ListQualificationsOutputDto } from '../dtos/list-qualifications.dto';
import { toQualificationDto } from '../mappers/qualification.mapper';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListQualificationsUseCase implements UseCase<
  void,
  ListQualificationsOutputDto
> {
  constructor(
    private readonly qualificationRepository: QualificationRepository,
  ) {}

  async execute(): Promise<ListQualificationsOutputDto> {
    const qualifications = await this.qualificationRepository.findAll();

    return {
      qualifications: qualifications.map(toQualificationDto),
    };
  }
}
