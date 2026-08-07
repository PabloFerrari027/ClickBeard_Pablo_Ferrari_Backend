import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  ListFutureAppointmentsInputDto,
  ListFutureAppointmentsOutputDto,
} from '../dtos/list-future-appointments.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

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

    const page = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;

    const { appointments, total } =
      await this.appointmentRepository.findUpcoming(
        new Date(),
        page,
        DEFAULT_LIMIT,
      );

    return {
      appointments: appointments.map(toAppointmentDto),
      page,
      totalPages: Math.ceil(total / DEFAULT_LIMIT),
    };
  }
}
