import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../../auth/presentation/decorators/auth.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../../auth/presentation/types/authenticated-request-user';
import { FieldSelectionInterceptor } from '../../../../shared/presentation/interceptors/field-selection.interceptor';
import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { CancelAppointmentByAdminUseCase } from '../../core/application/use-cases/cancel-appointment-by-admin.use-case';
import { CancelAppointmentUseCase } from '../../core/application/use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from '../../core/application/use-cases/create-appointment.use-case';
import { GetAppointmentUseCase } from '../../core/application/use-cases/get-appointment.use-case';
import { ListAvailableTimeSlotsUseCase } from '../../core/application/use-cases/list-available-time-slots.use-case';
import { ListCustomerAppointmentsUseCase } from '../../core/application/use-cases/list-customer-appointments.use-case';
import { ListFutureAppointmentsUseCase } from '../../core/application/use-cases/list-future-appointments.use-case';
import { ListTodayAppointmentsUseCase } from '../../core/application/use-cases/list-today-appointments.use-case';
import { parseBusinessCalendarDate } from '../../core/domain/value-objects/time-slot.value-object';
import { AppointmentResponseDto } from '../dtos/appointment.response.dto';
import { CancelAppointmentByAdminRequestDto } from '../dtos/cancel-appointment-by-admin.request.dto';
import { CreateAppointmentRequestDto } from '../dtos/create-appointment.request.dto';
import { ListAppointmentsResponseDto } from '../dtos/list-appointments.response.dto';
import { ListAvailableTimeSlotsQueryDto } from '../dtos/list-available-time-slots.query.dto';
import { ListAvailableTimeSlotsResponseDto } from '../dtos/list-available-time-slots.response.dto';
import { ListFutureAppointmentsQueryDto } from '../dtos/list-future-appointments.query.dto';

@ApiTags('Appointments')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly cancelAppointmentByAdminUseCase: CancelAppointmentByAdminUseCase,
    private readonly getAppointmentUseCase: GetAppointmentUseCase,
    private readonly listCustomerAppointmentsUseCase: ListCustomerAppointmentsUseCase,
    private readonly listTodayAppointmentsUseCase: ListTodayAppointmentsUseCase,
    private readonly listFutureAppointmentsUseCase: ListFutureAppointmentsUseCase,
    private readonly listAvailableTimeSlotsUseCase: ListAvailableTimeSlotsUseCase,
  ) {}

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Books an appointment for the current user' })
  @ApiOkResponse({ type: AppointmentResponseDto })
  async create(
    @Body() body: CreateAppointmentRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<AppointmentResponseDto> {
    const { appointment } = await this.createAppointmentUseCase.execute({
      ...body,
      startAt: new Date(body.startAt),
      customerId: requester.id,
    });
    return appointment;
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: "Lists the current user's appointments" })
  @ApiOkResponse({ type: ListAppointmentsResponseDto })
  async listMine(
    @CurrentUser() requester: AuthenticatedRequestUser,
    @Query('page') page?: string,
  ): Promise<ListAppointmentsResponseDto> {
    return this.listCustomerAppointmentsUseCase.execute({
      requesterId: requester.id,
      page: page ? Number(page) : undefined,
    });
  }

  @Get('today')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: "Lists today's appointments" })
  @ApiOkResponse({ type: ListAppointmentsResponseDto })
  async listToday(
    @CurrentUser() requester: AuthenticatedRequestUser,
    @Query('page') page?: string,
  ): Promise<ListAppointmentsResponseDto> {
    return this.listTodayAppointmentsUseCase.execute({
      requesterId: requester.id,
      page: page ? Number(page) : undefined,
    });
  }

  @Get('future')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Lists upcoming appointments, optionally narrowed to a time period',
  })
  @ApiOkResponse({ type: ListAppointmentsResponseDto })
  async listFuture(
    @CurrentUser() requester: AuthenticatedRequestUser,
    @Query() query: ListFutureAppointmentsQueryDto,
  ): Promise<ListAppointmentsResponseDto> {
    return this.listFutureAppointmentsUseCase.execute({
      requesterId: requester.id,
      page: query.page ? Number(query.page) : undefined,
      startAt: query.startAt ? new Date(query.startAt) : undefined,
      endAt: query.endAt ? new Date(query.endAt) : undefined,
    });
  }

  @Get('time-slots')
  @Auth()
  @ApiOperation({ summary: 'Lists a barber available time slots for a day' })
  @ApiOkResponse({ type: ListAvailableTimeSlotsResponseDto })
  async listAvailableTimeSlots(
    @Query() query: ListAvailableTimeSlotsQueryDto,
  ): Promise<ListAvailableTimeSlotsResponseDto> {
    return this.listAvailableTimeSlotsUseCase.execute({
      barberId: query.barberId,
      qualificationId: query.qualificationId,
      date: parseBusinessCalendarDate(query.date),
    });
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Gets an appointment by id' })
  @ApiOkResponse({ type: AppointmentResponseDto })
  async getById(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<AppointmentResponseDto> {
    const { appointment } = await this.getAppointmentUseCase.execute({
      appointmentId: id,
      requesterId: requester.id,
    });
    return appointment;
  }

  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: "Cancels the current user's appointment" })
  @ApiOkResponse({ type: AppointmentResponseDto })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<AppointmentResponseDto> {
    const { appointment } = await this.cancelAppointmentUseCase.execute({
      appointmentId: id,
      customerId: requester.id,
    });
    return appointment;
  }

  @Patch(':id/cancel')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Cancels any appointment with a mandatory reason; the customer is notified by email',
  })
  @ApiOkResponse({ type: AppointmentResponseDto })
  async cancelByAdmin(
    @Param('id') id: string,
    @Body() body: CancelAppointmentByAdminRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<AppointmentResponseDto> {
    const { appointment } = await this.cancelAppointmentByAdminUseCase.execute({
      appointmentId: id,
      requesterId: requester.id,
      reason: body.reason,
    });
    return appointment;
  }
}
