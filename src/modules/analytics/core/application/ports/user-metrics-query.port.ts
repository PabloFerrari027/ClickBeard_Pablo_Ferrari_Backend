import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { DateRange } from '../../domain/value-objects/date-range.value-object';

export const USER_METRICS_QUERY = Symbol('UserMetricsQuery');

export interface UserRoleCount {
  role: UserRole;
  total: number;
}

/**
 * Analytics-owned read model over the Identity and Account Verification
 * bounded contexts. Implemented later by an infrastructure adapter that
 * is free to join across those modules' storage directly — Analytics
 * only ever sees the aggregated counts, never their domain entities or
 * business rules.
 */
export interface UserMetricsQuery {
  countTotal(): Promise<number>;
  countByRole(): Promise<UserRoleCount[]>;
  countActive(): Promise<number>;
  countInactive(): Promise<number>;
  countRegisteredInRange(range: DateRange): Promise<number>;
  countPendingVerification(): Promise<number>;
  countVerified(): Promise<number>;
}
