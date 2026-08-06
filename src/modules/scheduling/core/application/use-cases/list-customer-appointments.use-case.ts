import {
  ListCustomerAppointmentsInputDto,
  ListCustomerAppointmentsOutputDto,
} from '../dtos/list-customer-appointments.dto';
import { toAppointmentDto } from '../mappers/appointment.mapper';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { UseCase } from '../../../../../shared/application/use-case';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

export class ListCustomerAppointmentsUseCase implements UseCase<
  ListCustomerAppointmentsInputDto,
  ListCustomerAppointmentsOutputDto
> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(
    input: ListCustomerAppointmentsInputDto,
  ): Promise<ListCustomerAppointmentsOutputDto> {
    const page = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;

    const { appointments, total } =
      await this.appointmentRepository.findByCustomerId(
        input.customerId,
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
