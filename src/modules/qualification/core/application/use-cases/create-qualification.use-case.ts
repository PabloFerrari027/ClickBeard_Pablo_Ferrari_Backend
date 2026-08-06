import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { Qualification } from '../../domain/entities/qualification.entity';
import {
  CreateQualificationInputDto,
  CreateQualificationOutputDto,
} from '../dtos/create-qualification.dto';
import { toQualificationDto } from '../mappers/qualification.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CreateQualificationUseCase implements UseCase<
  CreateQualificationInputDto,
  CreateQualificationOutputDto
> {
  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: CreateQualificationInputDto,
  ): Promise<CreateQualificationOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

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
