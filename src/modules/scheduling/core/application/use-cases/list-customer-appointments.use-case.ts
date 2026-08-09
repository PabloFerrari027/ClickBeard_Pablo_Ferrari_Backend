import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import {
  ListCustomerAppointmentsInputDto,
  ListCustomerAppointmentsOutputDto,
} from '../dtos/list-customer-appointments.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import {
  computeTotalPages,
  DEFAULT_LIMIT,
  resolvePage,
} from '../../../../../shared/application/pagination';
import { UseCase } from '../../../../../shared/application/use-case';

export class ListCustomerAppointmentsUseCase implements UseCase<
  ListCustomerAppointmentsInputDto,
  ListCustomerAppointmentsOutputDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListCustomerAppointmentsInputDto,
  ): Promise<ListCustomerAppointmentsOutputDto> {
    const page = resolvePage(input.page);
    const requester = await this.userRepository.findById(input.requesterId);

    if (requester?.getRole() === UserRole.BARBER) {
      return this.executeForBarber(input.requesterId, page);
    }

    const { appointments, total } =
      await this.appointmentRepository.findByCustomerId(
        input.requesterId,
        page,
        DEFAULT_LIMIT,
      );

    return {
      appointments: appointments.map(toAppointmentDto),
      page,
      totalPages: computeTotalPages(total),
    };
  }

  /**
   * A barber can appear both as the customer (self-booking with another
   * barber) and as the professional on the same appointment list, so the
   * two sources are merged and deduped by id. Both are fetched with the
   * same page/limit and merged rather than paginated as one combined set —
   * with more than DEFAULT_LIMIT appointments in either role this can
   * under/overlap pages slightly, an accepted tradeoff over the complexity
   * of true cross-source pagination.
   */
  private async executeForBarber(
    barberUserId: string,
    page: number,
  ): Promise<ListCustomerAppointmentsOutputDto> {
    const [asCustomer, asBarber] = await Promise.all([
      this.appointmentRepository.findByCustomerId(
        barberUserId,
        page,
        DEFAULT_LIMIT,
      ),
      this.appointmentRepository.findByBarberId(
        barberUserId,
        page,
        DEFAULT_LIMIT,
      ),
    ]);

    const merged = new Map<string, Appointment>();
    for (const appointment of [
      ...asCustomer.appointments,
      ...asBarber.appointments,
    ]) {
      merged.set(appointment.getId(), appointment);
    }

    const appointments = Array.from(merged.values()).sort(
      (a, b) =>
        a.getTimeSlot().getStart().getTime() -
        b.getTimeSlot().getStart().getTime(),
    );

    return {
      appointments: appointments.map(toAppointmentDto),
      page,
      totalPages: computeTotalPages(Math.max(asCustomer.total, asBarber.total)),
    };
  }
}
