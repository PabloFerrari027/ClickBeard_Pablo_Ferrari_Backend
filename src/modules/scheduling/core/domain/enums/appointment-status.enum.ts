export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
}

export function isValidAppointmentStatus(
  value: string,
): value is AppointmentStatus {
  return Object.values(AppointmentStatus).includes(value as AppointmentStatus);
}
