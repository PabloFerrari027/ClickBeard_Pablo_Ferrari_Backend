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
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(
    input: ListCustomerAppointmentsInputDto,
  ): Promise<ListCustomerAppointmentsOutputDto> {
    const page = resolvePage(input.page);

    const { appointments, total } =
      await this.appointmentRepository.findByCustomerId(
        input.customerId,
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
