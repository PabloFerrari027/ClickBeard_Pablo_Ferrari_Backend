import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { GenerateVerificationCodeUseCase } from '../../core/application/use-cases/generate-verification-code.use-case';
import { MESSAGE_QUEUE } from '../../../../shared/application/ports/message-queue.port';
import { DomainEvent } from '../../../../shared/domain/events/domain-event';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

interface VerificationCodeTriggerPayload extends Record<string, string> {
  userId: string;
  name: string;
}

const TRIGGER_EVENTS = new Set(['UserLoggedIn', 'UserRegistered']);

/**
 * `AccountVerificationController`'s doc comment anticipates this:
 * `GenerateVerificationCodeUseCase` is never exposed as a route, it only
 * ever runs off domain events — `LoginUseCase` confirms credentials but
 * never issues tokens itself, and `RegisterUserUseCase` never issues a
 * code inline either, so without this consumer neither a login nor a
 * fresh registration would ever get the user a code to complete
 * authentication with.
 *
 * A single consumer handles both triggers rather than one per event:
 * `BullMqMessageQueue.consume` maps a channel to exactly one BullMQ
 * `Worker`, and two `Worker`s on the same queue name are competing
 * consumers, not fan-out — a second `consume()` call on this channel
 * would silently never receive anything (see `DOMAIN_EVENTS_CHANNELS`).
 * Subscribes to Account Verification's own copy of the domain events
 * stream and ignores every event but the two it reacts to.
 */
@Injectable()
export class VerificationCodeRequestConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_QUEUE) private readonly messageQueue: MessageQueue,
    private readonly generateVerificationCodeUseCase: GenerateVerificationCodeUseCase,
  ) {}

  onModuleInit(): void {
    this.messageQueue.consume<DomainEvent<VerificationCodeTriggerPayload>>(
      DOMAIN_EVENTS_CHANNELS.ACCOUNT_VERIFICATION,
      async (message) => {
        const event = message.payload;

        if (!TRIGGER_EVENTS.has(event.name) || !event.recipientEmail) {
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
