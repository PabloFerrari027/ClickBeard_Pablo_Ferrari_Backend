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
import { RefreshTokenResponseDto } from '../../../auth/presentation/dtos/refresh-token.response.dto';
import { CompleteAuthenticationUseCase } from '../../core/application/use-cases/complete-authentication.use-case';
import { ResendVerificationCodeUseCase } from '../../core/application/use-cases/resend-verification-code.use-case';
import { ValidateVerificationCodeUseCase } from '../../core/application/use-cases/validate-verification-code.use-case';
import { CompleteAuthenticationRequestDto } from '../dtos/complete-authentication.request.dto';
import { ResendVerificationCodeRequestDto } from '../dtos/resend-verification-code.request.dto';
import { ResendVerificationCodeResponseDto } from '../dtos/resend-verification-code.response.dto';
import { ValidateVerificationCodeRequestDto } from '../dtos/validate-verification-code.request.dto';
import { ValidateVerificationCodeResponseDto } from '../dtos/validate-verification-code.response.dto';

/**
 * Only the genuinely client-facing use cases are exposed here.
 * GenerateVerificationCode runs off the UserLoggedIn event via
 * UserLoggedInConsumer, and InvalidateExpiredVerificationCodes is a
 * maintenance job run by ExpiredCodesSweepScheduler — exposing either as
 * a public route would let any caller generate/invalidate codes for
 * arbitrary accounts.
 */
@ApiTags('Account Verification')
@UseInterceptors(FieldSelectionInterceptor)
@Controller('account-verification')
export class AccountVerificationController {
  constructor(
    private readonly resendVerificationCodeUseCase: ResendVerificationCodeUseCase,
    private readonly validateVerificationCodeUseCase: ValidateVerificationCodeUseCase,
    private readonly completeAuthenticationUseCase: CompleteAuthenticationUseCase,
  ) {}

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resends the verification code, invalidating the previous one',
  })
  @ApiOkResponse({ type: ResendVerificationCodeResponseDto })
  async resend(
    @Body() body: ResendVerificationCodeRequestDto,
  ): Promise<ResendVerificationCodeResponseDto> {
    return this.resendVerificationCodeUseCase.execute(body);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validates a submitted verification code' })
  @ApiOkResponse({ type: ValidateVerificationCodeResponseDto })
  async validate(
    @Body() body: ValidateVerificationCodeRequestDto,
  ): Promise<ValidateVerificationCodeResponseDto> {
    return this.validateVerificationCodeUseCase.execute(body);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Creates the authenticated session once the verification code has been validated',
  })
  @ApiOkResponse({ type: RefreshTokenResponseDto })
  async complete(
    @Body() body: CompleteAuthenticationRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.completeAuthenticationUseCase.execute(body);
  }
}
