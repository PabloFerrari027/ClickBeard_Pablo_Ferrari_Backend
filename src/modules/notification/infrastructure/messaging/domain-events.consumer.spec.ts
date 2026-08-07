import { DomainEventsConsumer } from './domain-events.consumer';
import { DispatchNotificationUseCase } from '../../core/application/use-cases/dispatch-notification.use-case';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

describe('DomainEventsConsumer', () => {
  let messageQueue: jest.Mocked<MessageQueue>;
  let dispatchNotificationUseCase: jest.Mocked<DispatchNotificationUseCase>;
  let consumer: DomainEventsConsumer;

  beforeEach(() => {
    messageQueue = {
      enqueue: jest.fn(),
      consume: jest.fn(),
    };
    dispatchNotificationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DispatchNotificationUseCase>;
    consumer = new DomainEventsConsumer(
      messageQueue,
      dispatchNotificationUseCase,
    );
  });

  it("subscribes to Notification's own domain-events channel", () => {
    consumer.onModuleInit();

    expect(messageQueue.consume).toHaveBeenCalledWith(
      DOMAIN_EVENTS_CHANNELS.NOTIFICATIONS,
      expect.any(Function),
    );
  });

  it('dispatches every dequeued event to DispatchNotificationUseCase', async () => {
    consumer.onModuleInit();

    const handler = messageQueue.consume.mock.calls[0][1];

    const event = {
      name: 'UserRegistered',
      occurredAt: new Date(),
      recipientEmail: 'jane@example.com',
      payload: { name: 'Jane' },
    };

    await handler({ id: 'job-1', channel: 'x', payload: event });

    expect(dispatchNotificationUseCase.execute).toHaveBeenCalledWith(event);
  });
});
