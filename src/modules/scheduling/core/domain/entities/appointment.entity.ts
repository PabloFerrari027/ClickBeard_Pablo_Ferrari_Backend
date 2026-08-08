import { randomUUID } from 'node:crypto';

import { AppointmentAlreadyCancelledError } from '../errors/appointment-already-cancelled.error';
import { CancellationReasonRequiredError } from '../errors/cancellation-reason-required.error';
import { CancellationWindowExpiredError } from '../errors/cancellation-window-expired.error';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { TimeSlot } from '../value-objects/time-slot.value-object';

/**
 * The 2-hour minimum notice applies symmetrically: a customer can't book
 * a slot starting sooner than this from now, and can't cancel a slot
 * that's sooner than this away either.
 */
export const MIN_APPOINTMENT_NOTICE_MS = 2 * 60 * 60 * 1000;

export interface AppointmentProps {
  id: string;
  customerId: string;
  barberId: string;
  qualificationId: string;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

export class Appointment {
  private readonly id: string;
  private readonly customerId: string;
  private readonly barberId: string;
  private readonly qualificationId: string;
  private readonly timeSlot: TimeSlot;
  private status: AppointmentStatus;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private cancelledAt: Date | null;
  private cancellationReason: string | null;

  private constructor(props: AppointmentProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.barberId = props.barberId;
    this.qualificationId = props.qualificationId;
    this.timeSlot = props.timeSlot;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.cancelledAt = props.cancelledAt;
    this.cancellationReason = props.cancellationReason;
  }

  static create(props: {
    customerId: string;
    barberId: string;
    qualificationId: string;
    timeSlot: TimeSlot;
    now: Date;
  }): Appointment {
    return new Appointment({
      id: randomUUID(),
      customerId: props.customerId,
      barberId: props.barberId,
      qualificationId: props.qualificationId,
      timeSlot: props.timeSlot,
      status: AppointmentStatus.SCHEDULED,
      createdAt: props.now,
      updatedAt: props.now,
      cancelledAt: null,
      cancellationReason: null,
    });
  }

  static restore(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  cancel(now: Date): void {
    if (this.status === AppointmentStatus.CANCELLED) {
      throw new AppointmentAlreadyCancelledError();
    }

    const noticeMs = this.timeSlot.getStart().getTime() - now.getTime();

    if (noticeMs < MIN_APPOINTMENT_NOTICE_MS) {
      throw new CancellationWindowExpiredError();
    }

    this.status = AppointmentStatus.CANCELLED;
    this.cancelledAt = now;
    this.touch(now);
  }

  /**
   * Admin-initiated cancellation: unlike `cancel`, doesn't enforce
   * MIN_APPOINTMENT_NOTICE_MS (a barber calling in sick is often same-day)
   * and requires a reason, persisted for the customer's notification.
   */
  cancelByAdmin(now: Date, reason: string): void {
    if (this.status === AppointmentStatus.CANCELLED) {
      throw new AppointmentAlreadyCancelledError();
    }

    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      throw new CancellationReasonRequiredError();
    }

    this.status = AppointmentStatus.CANCELLED;
    this.cancelledAt = now;
    this.cancellationReason = trimmedReason;
    this.touch(now);
  }

  private touch(now: Date): void {
    this.updatedAt = now;
  }

  getId(): string {
    return this.id;
  }

  getCustomerId(): string {
    return this.customerId;
  }

  getBarberId(): string {
    return this.barberId;
  }

  getQualificationId(): string {
    return this.qualificationId;
  }

  getTimeSlot(): TimeSlot {
    return this.timeSlot;
  }

  getStatus(): AppointmentStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCancelledAt(): Date | null {
    return this.cancelledAt;
  }

  getCancellationReason(): string | null {
    return this.cancellationReason;
  }
}
