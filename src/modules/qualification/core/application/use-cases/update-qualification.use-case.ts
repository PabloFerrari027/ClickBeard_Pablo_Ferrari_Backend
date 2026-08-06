import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import {
  UpdateQualificationInputDto,
  UpdateQualificationOutputDto,
} from '../dtos/update-qualification.dto';
import { toQualificationDto } from '../mappers/qualification.mapper';
import { ensureRequesterIsAdmin } from '../../../../barber/core/application/policies/ensure-requester-is-admin.policy';
import { UserDirectory } from '../../../../barber/core/application/ports/user-directory.port';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class UpdateQualificationUseCase implements UseCase<
  UpdateQualificationInputDto,
  UpdateQualificationOutputDto
> {
  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly userDirectory: UserDirectory,
  ) {}

  async execute(
    input: UpdateQualificationInputDto,
  ): Promise<UpdateQualificationOutputDto> {
    await ensureRequesterIsAdmin(this.userDirectory, input.requesterId);

    const qualification = await this.qualificationRepository.findById(
      input.qualificationId,
    );

    if (!qualification) {
      throw new QualificationNotFoundError();
    }

    if (input.name !== undefined) {
      const conflictingQualification =
        await this.qualificationRepository.findByName(input.name);

      if (
        conflictingQualification &&
        conflictingQualification.getId() !== qualification.getId()
      ) {
        throw new QualificationAlreadyExistsError(input.name);
      }
    }

    qualification.update({
      name: input.name,
      description: input.description,
    });

    await this.qualificationRepository.save(qualification);

    return { qualification: toQualificationDto(qualification) };
  }
}
