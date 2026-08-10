import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { DeactivateBarberUseCase } from '../../core/application/use-cases/deactivate-barber.use-case';
import { MESSAGE_QUEUE } from '../../../../shared/application/ports/message-queue.port';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

interface UserRoleChangedPayload extends Record<string, string> {
  userId: string;
  previousRole: string;
  newRole: string;
}

const USER_ROLE_CHANGED_EVENT = 'UserRoleChanged';

/**
 * The `identity` module publishes `UserRoleChanged` on every role change
 * without knowing `barber` exists — this is the subscriber side, on
 * `barber`'s own copy of the domain events stream (see
 * DOMAIN_EVENTS_CHANNELS.BARBER). Without this consumer, demoting a
 * barber back to CLIENT would never deactivate their barber profile, so
 * they'd keep appearing in barber search/booking. Only reacts to a
 * transition away from BARBER — promotion back to BARBER is handled
 * synchronously by `CreateBarberUseCase` instead, since that's the only
 * path that ever grants the role in the first place.
 */
@Injectable()
export class UserRoleChangedConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_QUEUE) private readonly messageQueue: MessageQueue,
    private readonly deactivateBarberUseCase: DeactivateBarberUseCase,
  ) {}

  onModuleInit(): void {
    this.messageQueue.consume<DomainEvent<UserRoleChangedPayload>>(
      DOMAIN_EVENTS_CHANNELS.BARBER,
      async (message) => {
        const event = message.payload;

        if (
          event.name !== USER_ROLE_CHANGED_EVENT ||
          event.payload.previousRole !== 'BARBER' ||
          event.payload.newRole === 'BARBER'
        ) {
          return;
        }

        await this.deactivateBarberUseCase.execute({
          barberId: event.payload.userId,
        });
      },
    );
  }
}
