import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FieldSelectionInterceptor } from '../../../../shared/presentation/interceptors/field-selection.interceptor';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { ChangePasswordUseCase } from '../../core/application/use-cases/change-password.use-case';
import { ChangeUserRoleUseCase } from '../../core/application/use-cases/change-user-role.use-case';
import { GetUserProfileUseCase } from '../../core/application/use-cases/get-user-profile.use-case';
import { RegisterUserUseCase } from '../../core/application/use-cases/register-user.use-case';
import { AuthenticateUserRequestDto } from '../dtos/authenticate-user.request.dto';
import { ChangePasswordRequestDto } from '../dtos/change-password.request.dto';
import { ChangeUserRoleRequestDto } from '../dtos/change-user-role.request.dto';
import { RegisterUserRequestDto } from '../dtos/register-user.request.dto';
import { UserResponseDto } from '../dtos/user.response.dto';

@ApiTags('Users')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registers a new user' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Gets a user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getProfile(@Param('id') id: string): Promise<UserResponseDto> {
    const { user } = await this.getUserProfileUseCase.execute({
      userId: id,
    });

    return user;
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Changes a user's password" })
  async changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.changePasswordUseCase.execute({ userId: id, ...body });
  }

  @Patch(':id/role')
  @ApiOperation({ summary: "Changes a user's role" })
  @ApiOkResponse({ type: UserResponseDto })
  async changeRole(
    @Param('id') id: string,
    @Body() body: ChangeUserRoleRequestDto,
  ): Promise<UserResponseDto> {
    const { user } = await this.changeUserRoleUseCase.execute({
      userId: id,
      role: body.role,
    });

    return user;
  }
}
