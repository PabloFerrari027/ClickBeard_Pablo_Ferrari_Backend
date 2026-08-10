import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { Qualification } from '../../../../qualification/core/domain/entities/qualification.entity';
import { QualificationNotFoundError } from '../../../../qualification/core/domain/errors/qualification-not-found.error';
import { AdminCannotBecomeBarberError } from '../../domain/errors/admin-cannot-become-barber.error';
import { BarberAlreadyExistsError } from '../../domain/errors/barber-already-exists.error';
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

    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.getRole() === UserRole.ADMIN) {
      throw new AdminCannotBecomeBarberError();
    }

    const existingBarber = await this.barberRepository.findById(user.getId());

    if (existingBarber?.isActive()) {
      throw new BarberAlreadyExistsError();
    }

    // Barber creation is what grants the BARBER role — there is no
    // separate promotion step. Saving the role change before the barber
    // row also makes a failed/retried create idempotent: a retry finds
    // the user already BARBER and skips straight to creating the profile.
    if (user.getRole() !== UserRole.BARBER) {
      user.changeRole(UserRole.BARBER);
      await this.userRepository.save(user);
    }

    // A previously-demoted barber is reactivated as-is, keeping their
    // original age/hiredAt/qualifications rather than the new request's
    // — an admin can still adjust those afterward via the update/
    // qualification endpoints.
    if (existingBarber) {
      existingBarber.reactivate();
      await this.barberRepository.save(existingBarber);

      const qualifications = await this.qualificationRepository.listByBarberId(
        existingBarber.getId(),
      );

      return { barber: toBarberDto(existingBarber, qualifications) };
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
      userId: user.getId(),
      name: user.getName(),
      age: Age.create(input.age),
      hiredAt: input.hiredAt,
      qualificationIds,
    });

    await this.barberRepository.save(barber);

    return { barber: toBarberDto(barber, qualifications) };
  }
}
