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
import { AddQualificationToBarberUseCase } from '../../core/application/use-cases/add-qualification-to-barber.use-case';
import { CreateBarberUseCase } from '../../core/application/use-cases/create-barber.use-case';
import { GetBarberUseCase } from '../../core/application/use-cases/get-barber.use-case';
import { ListBarbersUseCase } from '../../core/application/use-cases/list-barbers.use-case';
import { RemoveQualificationFromBarberUseCase } from '../../core/application/use-cases/remove-qualification-from-barber.use-case';
import { UpdateBarberUseCase } from '../../core/application/use-cases/update-barber.use-case';
import { AddQualificationToBarberRequestDto } from '../dtos/add-qualification-to-barber.request.dto';
import { BarberResponseDto } from '../dtos/barber.response.dto';
import { CreateBarberRequestDto } from '../dtos/create-barber.request.dto';
import { ListBarbersResponseDto } from '../dtos/list-barbers.response.dto';
import { UpdateBarberRequestDto } from '../dtos/update-barber.request.dto';

@ApiTags('Barbers')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('barbers')
export class BarbersController {
  constructor(
    private readonly createBarberUseCase: CreateBarberUseCase,
    private readonly updateBarberUseCase: UpdateBarberUseCase,
    private readonly getBarberUseCase: GetBarberUseCase,
    private readonly listBarbersUseCase: ListBarbersUseCase,
    private readonly addQualificationToBarberUseCase: AddQualificationToBarberUseCase,
    private readonly removeQualificationFromBarberUseCase: RemoveQualificationFromBarberUseCase,
  ) {}

  @Post()
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a barber profile for an identity user' })
  @ApiOkResponse({ type: BarberResponseDto })
  async create(
    @Body() body: CreateBarberRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<BarberResponseDto> {
    const { barber } = await this.createBarberUseCase.execute({
      ...body,
      hiredAt: new Date(body.hiredAt),
      requesterId: requester.id,
    });
    return barber;
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Lists barbers' })
  @ApiOkResponse({ type: ListBarbersResponseDto })
  async list(@Query('page') page?: string): Promise<ListBarbersResponseDto> {
    return this.listBarbersUseCase.execute({
      page: page ? Number(page) : undefined,
    });
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Gets a barber by id' })
  @ApiOkResponse({ type: BarberResponseDto })
  async getById(@Param('id') id: string): Promise<BarberResponseDto> {
    const { barber } = await this.getBarberUseCase.execute({ barberId: id });
    return barber;
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Updates a barber' })
  @ApiOkResponse({ type: BarberResponseDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBarberRequestDto,
  ): Promise<BarberResponseDto> {
    const { barber } = await this.updateBarberUseCase.execute({
      barberId: id,
      age: body.age,
      hiredAt: body.hiredAt ? new Date(body.hiredAt) : undefined,
    });
    return barber;
  }

  @Post(':id/qualifications')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Adds a qualification to a barber' })
  @ApiOkResponse({ type: BarberResponseDto })
  async addQualification(
    @Param('id') id: string,
    @Body() body: AddQualificationToBarberRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<BarberResponseDto> {
    const { barber } = await this.addQualificationToBarberUseCase.execute({
      barberId: id,
      qualificationId: body.qualificationId,
      requesterId: requester.id,
    });
    return barber;
  }

  @Delete(':id/qualifications/:qualificationId')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Removes a qualification from a barber' })
  @ApiOkResponse({ type: BarberResponseDto })
  async removeQualification(
    @Param('id') id: string,
    @Param('qualificationId') qualificationId: string,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<BarberResponseDto> {
    const { barber } = await this.removeQualificationFromBarberUseCase.execute({
      barberId: id,
      qualificationId,
      requesterId: requester.id,
    });
    return barber;
  }
}
