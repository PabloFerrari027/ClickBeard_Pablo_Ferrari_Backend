export interface ResendVerificationCodeInputDto {
  userId: string;
  email: string;
  name: string;
}

export interface ResendVerificationCodeOutputDto {
  verificationCodeId: string;
  expiresAt: Date;
}
