import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { AppointmentAccessDeniedError } from '../../domain/errors/appointment-access-denied.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import {
  GetAppointmentInputDto,
  GetAppointmentOutputDto,
} from '../dtos/get-appointment.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

export class GetAppointmentUseCase implements UseCase<
  GetAppointmentInputDto,
  GetAppointmentOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GetAppointmentInputDto,
  ): Promise<GetAppointmentOutputDto> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new AppointmentNotFoundError();
    }

    if (appointment.getCustomerId() !== input.requesterId) {
      const requester = await this.userRepository.findById(input.requesterId);

      if (!requester || requester.getRole() !== UserRole.ADMIN) {
        throw new AppointmentAccessDeniedError();
      }
    }

    return { appointment: toAppointmentDto(appointment) };
  }
}
