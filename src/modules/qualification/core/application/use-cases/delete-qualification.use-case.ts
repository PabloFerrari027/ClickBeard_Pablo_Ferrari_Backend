import { QualificationInUseError } from '../../domain/errors/qualification-in-use.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import { DeleteQualificationInputDto } from '../dtos/delete-qualification.dto';
import { ensureRequesterIsAdmin } from '../../../../barber/core/application/policies/ensure-requester-is-admin.policy';
import { BarberRepository } from '../../../../barber/core/application/ports/barber-repository.port';
import { UserDirectory } from '../../../../barber/core/application/ports/user-directory.port';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class DeleteQualificationUseCase implements UseCase<
  DeleteQualificationInputDto,
  void
> {
  constructor(
    private readonly qualificationRepository: QualificationRepository,
    private readonly barberRepository: BarberRepository,
    private readonly userDirectory: UserDirectory,
  ) {}

  async execute(input: DeleteQualificationInputDto): Promise<void> {
    await ensureRequesterIsAdmin(this.userDirectory, input.requesterId);

    const qualification = await this.qualificationRepository.findById(
      input.qualificationId,
    );

    if (!qualification) {
      throw new QualificationNotFoundError();
    }

    const isInUse = await this.barberRepository.existsByQualificationId(
      input.qualificationId,
    );

    if (isInUse) {
      throw new QualificationInUseError();
    }

    await this.qualificationRepository.delete(input.qualificationId);
  }
}
