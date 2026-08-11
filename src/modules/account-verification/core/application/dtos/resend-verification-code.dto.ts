export interface ResendVerificationCodeInputDto {
  userId: string;
}

export interface ResendVerificationCodeOutputDto {
  verificationCodeId: string;
  expiresAt: Date;
}
