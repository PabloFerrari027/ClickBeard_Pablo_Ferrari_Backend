import { Inject, Injectable } from '@nestjs/common';

import { DOMAIN_EVENTS_CHANNELS } from './domain-events.channel';
import { MESSAGE_QUEUE } from '../application/ports/message-queue.port';
import { DomainEvent } from '../domain/events/domain-event';

import type { EventBus } from '../application/ports/event-bus.port';
import type { MessageQueue } from '../application/ports/message-queue.port';

/**
 * Fans every domain event out to every subscriber channel via
 * `MessageQueue`, moving it off the request path — Core use cases only
 * ever depend on `EventBus`, never on `MessageQueue` directly (see that
 * port's doc comment). Each subscriber filters for the event names it
 * actually cares about; a channel with nothing listening for a given
 * event just never acts on it.
 */
@Injectable()
export class QueueEventBus implements EventBus {
  constructor(
    @Inject(MESSAGE_QUEUE) private readonly messageQueue: MessageQueue,
  ) {}

  async publish<Payload extends Record<string, string>>(
    event: DomainEvent<Payload>,
  ): Promise<void> {
    await Promise.all(
      Object.values(DOMAIN_EVENTS_CHANNELS).map((channel) =>
        this.messageQueue.enqueue(channel, event),
      ),
    );
  }
}
