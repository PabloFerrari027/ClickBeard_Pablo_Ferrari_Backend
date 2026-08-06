import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { Qualification } from '../../../../qualification/core/domain/entities/qualification.entity';
import { QualificationNotFoundError } from '../../../../qualification/core/domain/errors/qualification-not-found.error';
import { BarberAlreadyExistsError } from '../../domain/errors/barber-already-exists.error';
import { UserIsNotBarberError } from '../../domain/errors/user-is-not-barber.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import {
  CreateBarberInputDto,
  CreateBarberOutputDto,
} from '../dtos/create-barber.dto';
import { toBarberDto } from '../mappers/barber.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { BarberRepository } from '../ports/barber-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class CreateBarberUseCase implements UseCase<
  CreateBarberInputDto,
  CreateBarberOutputDto
> {
  constructor(
    private readonly barberRepository: BarberRepository,
    private readonly qualificationRepository: QualificationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateBarberInputDto): Promise<CreateBarberOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.getRole() !== UserRole.BARBER) {
      throw new UserIsNotBarberError();
    }

    const existingBarber = await this.barberRepository.findById(input.userId);

    if (existingBarber) {
      throw new BarberAlreadyExistsError();
    }

    const qualificationIds = Array.from(new Set(input.qualificationIds));
    const qualifications: Qualification[] = [];

    for (const qualificationId of qualificationIds) {
      const qualification =
        await this.qualificationRepository.findById(qualificationId);

      if (!qualification) {
        throw new QualificationNotFoundError();
      }

      qualifications.push(qualification);
    }

    const barber = Barber.create({
      userId: input.userId,
      name: user.getName(),
      age: Age.create(input.age),
      hiredAt: input.hiredAt,
      qualificationIds,
    });

    await this.barberRepository.save(barber);

    return { barber: toBarberDto(barber, qualifications) };
  }
}
