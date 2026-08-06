import { Session } from '../ports/session-manager.port';

export interface CompleteAuthenticationInputDto {
  userId: string;
}

export type CompleteAuthenticationOutputDto = Session;
