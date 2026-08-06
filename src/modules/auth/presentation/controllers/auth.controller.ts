import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FieldSelectionInterceptor } from '../../../../shared/presentation/interceptors/field-selection.interceptor';
import { LoginUseCase } from '../../core/application/use-cases/login.use-case';
import { LogoutUseCase } from '../../core/application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../core/application/use-cases/refresh-token.use-case';
import { LoginRequestDto } from '../dtos/login.request.dto';
import { LoginResponseDto } from '../dtos/login.response.dto';
import { LogoutRequestDto } from '../dtos/logout.request.dto';
import { RefreshTokenRequestDto } from '../dtos/refresh-token.request.dto';
import { RefreshTokenResponseDto } from '../dtos/refresh-token.response.dto';

@ApiTags('Auth')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Validates credentials and starts the verification flow; no session is created yet',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(body);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotates a refresh token for a new token pair' })
  @ApiOkResponse({ type: RefreshTokenResponseDto })
  async refreshToken(
    @Body() body: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.refreshTokenUseCase.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revokes a refresh token' })
  async logout(@Body() body: LogoutRequestDto): Promise<void> {
    await this.logoutUseCase.execute(body);
  }
}
