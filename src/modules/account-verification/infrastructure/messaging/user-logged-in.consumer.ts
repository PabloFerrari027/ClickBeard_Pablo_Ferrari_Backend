import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { GenerateVerificationCodeUseCase } from '../../core/application/use-cases/generate-verification-code.use-case';
import { MESSAGE_QUEUE } from '../../../../shared/application/ports/message-queue.port';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

interface UserLoggedInPayload extends Record<string, string> {
  userId: string;
  name: string;
}

const USER_LOGGED_IN_EVENT = 'UserLoggedIn';

/**
 * `AccountVerificationController`'s doc comment anticipates this:
 * `GenerateVerificationCodeUseCase` is never exposed as a route, it
 * only ever runs off `UserLoggedIn` — `LoginUseCase` confirms
 * credentials and publishes that event but never issues tokens itself
 * (see its own doc comment), so without this consumer a successful
 * login would never actually get the user a code to complete
 * authentication with. Subscribes to Account Verification's own copy
 * of the domain events stream and ignores every event but this one.
 */
@Injectable()
export class UserLoggedInConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_QUEUE) private readonly messageQueue: MessageQueue,
    private readonly generateVerificationCodeUseCase: GenerateVerificationCodeUseCase,
  ) {}

  onModuleInit(): void {
    this.messageQueue.consume<DomainEvent<UserLoggedInPayload>>(
      DOMAIN_EVENTS_CHANNELS.ACCOUNT_VERIFICATION,
      async (message) => {
        const event = message.payload;

        if (event.name !== USER_LOGGED_IN_EVENT || !event.recipientEmail) {
          return;
        }

        await this.generateVerificationCodeUseCase.execute({
          userId: event.payload.userId,
          email: event.recipientEmail,
          name: event.payload.name,
        });
      },
    );
  }
}
