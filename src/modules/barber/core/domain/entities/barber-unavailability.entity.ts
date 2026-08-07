import { randomUUID } from 'node:crypto';

import { InvalidUnavailabilityPeriodError } from '../errors/invalid-unavailability-period.error';
import { UnavailabilityReasonRequiredError } from '../errors/unavailability-reason-required.error';

const MIN_REASON_LENGTH = 3;

export interface BarberUnavailabilityProps {
  id: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  createdAt: Date;
}

/**
 * Immutable once created — there is no update method. To change a
 * period, delete it and create a new one (see
 * DeleteBarberUnavailabilityUseCase/CreateBarberUnavailabilityUseCase).
 */
export class BarberUnavailability {
  private readonly id: string;
  private readonly barberId: string;
  private readonly startAt: Date;
  private readonly endAt: Date;
  private readonly reason: string;
  private readonly createdAt: Date;

  private constructor(props: BarberUnavailabilityProps) {
    this.id = props.id;
    this.barberId = props.barberId;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
  }

  static create(props: {
    barberId: string;
    startAt: Date;
    endAt: Date;
    reason: string;
    now: Date;
  }): BarberUnavailability {
    if (props.endAt.getTime() <= props.startAt.getTime()) {
      throw new InvalidUnavailabilityPeriodError();
    }

    const trimmedReason = props.reason.trim();

    if (trimmedReason.length < MIN_REASON_LENGTH) {
      throw new UnavailabilityReasonRequiredError();
    }

    return new BarberUnavailability({
      id: randomUUID(),
      barberId: props.barberId,
      startAt: props.startAt,
      endAt: props.endAt,
      reason: trimmedReason,
      createdAt: props.now,
    });
  }

  static restore(props: BarberUnavailabilityProps): BarberUnavailability {
    return new BarberUnavailability(props);
  }

  getId(): string {
    return this.id;
  }

  getBarberId(): string {
    return this.barberId;
  }

  getStartAt(): Date {
    return this.startAt;
  }

  getEndAt(): Date {
    return this.endAt;
  }

  getReason(): string {
    return this.reason;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
