import { DOMAIN_EVENTS_CHANNELS } from './domain-events.channel';
import { QueueEventBus } from './queue-event-bus';

import type { MessageQueue } from '../application/ports/message-queue.port';
import type { DomainEvent } from '../domain/events/domain-event';

describe('QueueEventBus', () => {
  let messageQueue: jest.Mocked<MessageQueue>;
  let eventBus: QueueEventBus;

  beforeEach(() => {
    messageQueue = {
      enqueue: jest.fn(),
      consume: jest.fn(),
    };
    eventBus = new QueueEventBus(messageQueue);
  });

  it('fans the event out to every subscriber channel', async () => {
    const event: DomainEvent<{ userId: string }> = {
      name: 'UserRegistered',
      occurredAt: new Date(),
      recipientEmail: 'jane@example.com',
      payload: { userId: 'user-1' },
    };

    await eventBus.publish(event);

    const channels = Object.values(DOMAIN_EVENTS_CHANNELS);
    expect(messageQueue.enqueue).toHaveBeenCalledTimes(channels.length);

    for (const channel of channels) {
      expect(messageQueue.enqueue).toHaveBeenCalledWith(channel, event);
    }
  });
});
