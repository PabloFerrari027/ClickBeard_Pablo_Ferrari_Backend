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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../../auth/presentation/decorators/auth.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../../auth/presentation/types/authenticated-request-user';
import { FieldSelectionInterceptor } from '../../../../shared/presentation/interceptors/field-selection.interceptor';
import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { CreateQualificationUseCase } from '../../core/application/use-cases/create-qualification.use-case';
import { DeleteQualificationUseCase } from '../../core/application/use-cases/delete-qualification.use-case';
import { ListQualificationsUseCase } from '../../core/application/use-cases/list-qualifications.use-case';
import { UpdateQualificationUseCase } from '../../core/application/use-cases/update-qualification.use-case';
import { CreateQualificationRequestDto } from '../dtos/create-qualification.request.dto';
import { QualificationResponseDto } from '../dtos/qualification.response.dto';
import { UpdateQualificationRequestDto } from '../dtos/update-qualification.request.dto';

@ApiTags('Qualifications')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('qualifications')
export class QualificationsController {
  constructor(
    private readonly createQualificationUseCase: CreateQualificationUseCase,
    private readonly updateQualificationUseCase: UpdateQualificationUseCase,
    private readonly deleteQualificationUseCase: DeleteQualificationUseCase,
    private readonly listQualificationsUseCase: ListQualificationsUseCase,
  ) {}

  @Post()
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a new qualification' })
  @ApiOkResponse({ type: QualificationResponseDto })
  async create(
    @Body() body: CreateQualificationRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<QualificationResponseDto> {
    const { qualification } = await this.createQualificationUseCase.execute({
      ...body,
      requesterId: requester.id,
    });
    return qualification;
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Lists all qualifications' })
  @ApiOkResponse({ type: QualificationResponseDto, isArray: true })
  async list(): Promise<QualificationResponseDto[]> {
    const { qualifications } = await this.listQualificationsUseCase.execute();
    return qualifications;
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Updates a qualification' })
  @ApiOkResponse({ type: QualificationResponseDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateQualificationRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<QualificationResponseDto> {
    const { qualification } = await this.updateQualificationUseCase.execute({
      qualificationId: id,
      ...body,
      requesterId: requester.id,
    });
    return qualification;
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletes a qualification' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<void> {
    await this.deleteQualificationUseCase.execute({
      qualificationId: id,
      requesterId: requester.id,
    });
  }
}
