export interface AppointmentDto {
  id: string;
  customerId: string;
  barberId: string;
  qualificationId: string;
  startAt: Date;
  endAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}
