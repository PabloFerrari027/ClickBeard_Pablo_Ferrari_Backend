import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { InvalidAppointmentPeriodError } from '../../domain/errors/invalid-appointment-period.error';
import {
  ListFutureAppointmentsInputDto,
  ListFutureAppointmentsOutputDto,
} from '../dtos/list-future-appointments.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import {
  computeTotalPages,
  DEFAULT_LIMIT,
  resolvePage,
} from '../../../../../shared/application/pagination';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListFutureAppointmentsUseCase implements UseCase<
  ListFutureAppointmentsInputDto,
  ListFutureAppointmentsOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListFutureAppointmentsInputDto,
  ): Promise<ListFutureAppointmentsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    if (
      input.startAt &&
      input.endAt &&
      input.startAt.getTime() > input.endAt.getTime()
    ) {
      throw new InvalidAppointmentPeriodError();
    }

    const page = resolvePage(input.page);
    const now = new Date();
    const from =
      input.startAt && input.startAt.getTime() > now.getTime()
        ? input.startAt
        : now;

    const { appointments, total } =
      await this.appointmentRepository.findUpcoming(
        from,
        page,
        DEFAULT_LIMIT,
        input.endAt,
      );

    return {
      appointments: appointments.map(toAppointmentDto),
      page,
      totalPages: computeTotalPages(total),
    };
  }
}
