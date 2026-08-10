import {
  Body,
  Controller,
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
import { Self } from '../../../auth/presentation/decorators/self.decorator';
import { SelfOrAdmin } from '../../../auth/presentation/decorators/self-or-admin.decorator';
import type { AuthenticatedRequestUser } from '../../../auth/presentation/types/authenticated-request-user';
import { FieldSelectionInterceptor } from '../../../../shared/presentation/interceptors/field-selection.interceptor';
import { UserRole } from '../../core/domain/enums/user-role.enum';
import { ActivateUserUseCase } from '../../core/application/use-cases/activate-user.use-case';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { ChangePasswordUseCase } from '../../core/application/use-cases/change-password.use-case';
import { ChangeUserRoleUseCase } from '../../core/application/use-cases/change-user-role.use-case';
import { DeactivateUserUseCase } from '../../core/application/use-cases/deactivate-user.use-case';
import { GetUserProfileUseCase } from '../../core/application/use-cases/get-user-profile.use-case';
import { ListUsersUseCase } from '../../core/application/use-cases/list-users.use-case';
import { RegisterUserUseCase } from '../../core/application/use-cases/register-user.use-case';
import { UpdateUserProfileUseCase } from '../../core/application/use-cases/update-user-profile.use-case';
import { AuthenticateUserRequestDto } from '../dtos/authenticate-user.request.dto';
import { ChangePasswordRequestDto } from '../dtos/change-password.request.dto';
import { ChangeUserRoleRequestDto } from '../dtos/change-user-role.request.dto';
import { ListUsersResponseDto } from '../dtos/list-users.response.dto';
import { RegisterUserRequestDto } from '../dtos/register-user.request.dto';
import { UpdateUserProfileRequestDto } from '../dtos/update-user-profile.request.dto';
import { UserResponseDto } from '../dtos/user.response.dto';

@ApiTags('Users')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registers a new user. Always created as CLIENT — promoting to ADMIN requires an existing admin via PATCH /users/:id/role; becoming a BARBER requires an admin to create a barber profile via POST /barbers',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async register(
    @Body() body: RegisterUserRequestDto,
  ): Promise<UserResponseDto> {
    const { user } = await this.registerUserUseCase.execute(body);

    return user;
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticates a user by email and password' })
  @ApiOkResponse({ type: UserResponseDto })
  async authenticate(
    @Body() body: AuthenticateUserRequestDto,
  ): Promise<UserResponseDto> {
    const { user } = await this.authenticateUserUseCase.execute(body);

    return user;
  }

  @Get()
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lists users' })
  @ApiOkResponse({ type: ListUsersResponseDto })
  async list(@Query('page') page?: string): Promise<ListUsersResponseDto> {
    return this.listUsersUseCase.execute({
      page: page ? Number(page) : undefined,
    });
  }

  @Get(':id')
  @SelfOrAdmin()
  @ApiOperation({ summary: 'Gets a user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getProfile(@Param('id') id: string): Promise<UserResponseDto> {
    const { user } = await this.getUserProfileUseCase.execute({
      userId: id,
    });

    return user;
  }

  @Patch(':id/password')
  @SelfOrAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Changes a user's password" })
  async changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.changePasswordUseCase.execute({ userId: id, ...body });
  }

  @Patch(':id/profile')
  @Self()
  @ApiOperation({
    summary:
      "Updates a user's own profile (name and/or birth date) — only the account owner can call this, not even an admin",
  })
  @ApiOkResponse({ type: UserResponseDto })
  async updateProfile(
    @Param('id') id: string,
    @Body() body: UpdateUserProfileRequestDto,
  ): Promise<UserResponseDto> {
    const { user } = await this.updateUserProfileUseCase.execute({
      userId: id,
      ...body,
    });

    return user;
  }

  @Patch(':id/role')
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary:
      "Changes a user's role between CLIENT and ADMIN. Cannot be used to assign BARBER — create a barber profile via POST /barbers instead",
  })
  @ApiOkResponse({ type: UserResponseDto })
  async changeRole(
    @Param('id') id: string,
    @Body() body: ChangeUserRoleRequestDto,
    @CurrentUser() requester: AuthenticatedRequestUser,
  ): Promise<UserResponseDto> {
    const { user } = await this.changeUserRoleUseCase.execute({
      userId: id,
      role: body.role,
      requesterId: requester.id,
    });

    return user;
  }

  @Patch(':id/deactivate')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivates a user' })
  @ApiOkResponse({ type: UserResponseDto })
  async deactivate(@Param('id') id: string): Promise<UserResponseDto> {
    const { user } = await this.deactivateUserUseCase.execute({
      userId: id,
    });

    return user;
  }

  @Patch(':id/activate')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activates a user' })
  @ApiOkResponse({ type: UserResponseDto })
  async activate(@Param('id') id: string): Promise<UserResponseDto> {
    const { user } = await this.activateUserUseCase.execute({ userId: id });

    return user;
  }
}
