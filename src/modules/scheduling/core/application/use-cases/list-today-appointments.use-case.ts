import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  ListTodayAppointmentsInputDto,
  ListTodayAppointmentsOutputDto,
} from '../dtos/list-today-appointments.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import {
  computeTotalPages,
  DEFAULT_LIMIT,
  resolvePage,
} from '../../../../../shared/application/pagination';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListTodayAppointmentsUseCase implements UseCase<
  ListTodayAppointmentsInputDto,
  ListTodayAppointmentsOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListTodayAppointmentsInputDto,
  ): Promise<ListTodayAppointmentsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const page = resolvePage(input.page);

    const { appointments, total } = await this.appointmentRepository.findByDate(
      new Date(),
      page,
      DEFAULT_LIMIT,
    );

    return {
      appointments: appointments.map(toAppointmentDto),
      page,
      totalPages: computeTotalPages(total),
    };
  }
}
