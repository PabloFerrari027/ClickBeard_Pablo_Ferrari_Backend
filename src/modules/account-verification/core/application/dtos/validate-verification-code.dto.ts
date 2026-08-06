export interface ValidateVerificationCodeInputDto {
  userId: string;
  code: string;
}

export interface ValidateVerificationCodeOutputDto {
  verified: true;
}
