import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { CancelAppointmentsForBarberUnavailabilityUseCase } from '../../core/application/use-cases/cancel-appointments-for-barber-unavailability.use-case';
import { MESSAGE_QUEUE } from '../../../../shared/application/ports/message-queue.port';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

interface BarberUnavailabilityCreatedPayload extends Record<string, string> {
  unavailabilityId: string;
  barberId: string;
  startAt: string;
  endAt: string;
  reason: string;
}

const BARBER_UNAVAILABILITY_CREATED_EVENT = 'BarberUnavailabilityCreated';

/**
 * The `barber` module publishes `BarberUnavailabilityCreated` without
 * knowing `scheduling` exists — this is the subscriber side, on
 * `scheduling`'s own copy of the domain events stream (see
 * DOMAIN_EVENTS_CHANNELS.SCHEDULING). Without this consumer, marking a
 * barber unavailable would never actually cancel their conflicting
 * appointments — it's the only thing that makes the cascade happen.
 */
@Injectable()
export class BarberUnavailabilityCreatedConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_QUEUE) private readonly messageQueue: MessageQueue,
    private readonly cancelAppointmentsForBarberUnavailabilityUseCase: CancelAppointmentsForBarberUnavailabilityUseCase,
  ) {}

  onModuleInit(): void {
    this.messageQueue.consume<DomainEvent<BarberUnavailabilityCreatedPayload>>(
      DOMAIN_EVENTS_CHANNELS.SCHEDULING,
      async (message) => {
        const event = message.payload;

        if (event.name !== BARBER_UNAVAILABILITY_CREATED_EVENT) {
          return;
        }

        await this.cancelAppointmentsForBarberUnavailabilityUseCase.execute({
          barberId: event.payload.barberId,
          startAt: new Date(event.payload.startAt),
          endAt: new Date(event.payload.endAt),
          reason: event.payload.reason,
        });
      },
    );
  }
}
