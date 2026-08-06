import { UserRoleCount } from '../ports/user-metrics-query.port';

export interface UserMetricsDto {
  totalUsers: number;
  totalByRole: UserRoleCount[];
  activeUsers: number;
  inactiveUsers: number;
  newUsersInPeriod: number;
  pendingVerification: number;
  verifiedAccounts: number;
}
