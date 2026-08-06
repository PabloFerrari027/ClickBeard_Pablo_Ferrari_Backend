import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import {
  UpdateQualificationInputDto,
  UpdateQualificationOutputDto,
} from '../dtos/update-qualification.dto';
import { toQualificationDto } from '../mappers/qualification.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class UpdateQualificationUseCase implements UseCase<
  UpdateQualificationInputDto,
  UpdateQualificationOutputDto
> {
  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: UpdateQualificationInputDto,
  ): Promise<UpdateQualificationOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

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
