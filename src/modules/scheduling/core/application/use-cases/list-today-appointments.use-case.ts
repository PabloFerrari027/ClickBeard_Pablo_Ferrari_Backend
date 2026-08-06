import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import {
  ListTodayAppointmentsInputDto,
  ListTodayAppointmentsOutputDto,
} from '../dtos/list-today-appointments.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { ensureRequesterIsAdmin } from '../policies/ensure-requester-is-admin.policy';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { UseCase } from '../../../../../shared/application/use-case';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

export class ListTodayAppointmentsUseCase implements UseCase<
  ListTodayAppointmentsInputDto,
  ListTodayAppointmentsOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ListTodayAppointmentsInputDto,
  ): Promise<ListTodayAppointmentsOutputDto> {
    await ensureRequesterIsAdmin(this.userRepository, input.requesterId);

    const page = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;

    const { appointments, total } = await this.appointmentRepository.findByDate(
      this.clock.now(),
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
