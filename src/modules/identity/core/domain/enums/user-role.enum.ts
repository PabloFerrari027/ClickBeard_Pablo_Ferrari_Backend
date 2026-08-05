export enum UserRole {
  CLIENT = 'CLIENT',
  BARBER = 'BARBER',
  ADMIN = 'ADMIN',
}

export function isValidUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}
