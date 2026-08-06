import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { Qualification } from '../../domain/entities/qualification.entity';
import {
  CreateQualificationInputDto,
  CreateQualificationOutputDto,
} from '../dtos/create-qualification.dto';
import { toQualificationDto } from '../mappers/qualification.mapper';
import { ensureRequesterIsAdmin } from '../../../../barber/core/application/policies/ensure-requester-is-admin.policy';
import { UserDirectory } from '../../../../barber/core/application/ports/user-directory.port';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CreateQualificationUseCase implements UseCase<
  CreateQualificationInputDto,
  CreateQualificationOutputDto
> {
  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly userDirectory: UserDirectory,
  ) {}

  async execute(
    input: CreateQualificationInputDto,
  ): Promise<CreateQualificationOutputDto> {
    await ensureRequesterIsAdmin(this.userDirectory, input.requesterId);

    const existingQualification = await this.qualificationRepository.findByName(
      input.name,
    );

    if (existingQualification) {
      throw new QualificationAlreadyExistsError(input.name);
    }

    const qualification = Qualification.create({
      name: input.name,
      description: input.description,
    });

    await this.qualificationRepository.save(qualification);

    return { qualification: toQualificationDto(qualification) };
  }
}
