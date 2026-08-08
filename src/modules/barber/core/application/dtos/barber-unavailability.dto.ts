export interface BarberUnavailabilityDto {
  id: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  createdAt: Date;
}
