export interface GenerateVerificationCodeInputDto {
  userId: string;
  email: string;
  name: string;
}

export interface GenerateVerificationCodeOutputDto {
  verificationCodeId: string;
  expiresAt: Date;
}
