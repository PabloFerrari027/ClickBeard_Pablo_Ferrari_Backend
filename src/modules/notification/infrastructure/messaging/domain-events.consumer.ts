import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DispatchNotificationUseCase } from '../../core/application/use-cases/dispatch-notification.use-case';
import { MESSAGE_QUEUE } from '../../../../shared/application/ports/message-queue.port';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

/**
 * The queue consumer `NotificationDispatcher`'s doc comment anticipates:
 * subscribes to Notification's own copy of the domain events stream
 * (see `DOMAIN_EVENTS_CHANNELS`) and runs `DispatchNotificationUseCase`
 * for each event dequeued — that use case already no-ops on any event
 * with no template or no `recipientEmail`, so this never filters by
 * event name itself. Registered once per process via `onModuleInit`.
 */
@Injectable()
export class DomainEventsConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_QUEUE) private readonly messageQueue: MessageQueue,
    private readonly dispatchNotificationUseCase: DispatchNotificationUseCase,
  ) {}

  onModuleInit(): void {
    this.messageQueue.consume<DomainEvent>(
      DOMAIN_EVENTS_CHANNELS.NOTIFICATIONS,
      async (message) => {
        await this.dispatchNotificationUseCase.execute(message.payload);
      },
    );
  }
}
