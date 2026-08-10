import { UserRoleChangedConsumer } from './user-role-changed.consumer';
import { DeactivateBarberUseCase } from '../../core/application/use-cases/deactivate-barber.use-case';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

describe('UserRoleChangedConsumer', () => {
  let messageQueue: jest.Mocked<MessageQueue>;
  let deactivateBarberUseCase: jest.Mocked<DeactivateBarberUseCase>;
  let consumer: UserRoleChangedConsumer;

  function captureHandler(): (message: {
    id: string;
    channel: string;
    payload: unknown;
  }) => Promise<void> {
    consumer.onModuleInit();

    return messageQueue.consume.mock.calls[0][1];
  }

  beforeEach(() => {
    messageQueue = {
      enqueue: jest.fn(),
      consume: jest.fn(),
    };
    deactivateBarberUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeactivateBarberUseCase>;
    consumer = new UserRoleChangedConsumer(
      messageQueue,
      deactivateBarberUseCase,
    );
  });

  it("subscribes once to Barber's own domain-events channel", () => {
    consumer.onModuleInit();

    expect(messageQueue.consume).toHaveBeenCalledTimes(1);
    expect(messageQueue.consume).toHaveBeenCalledWith(
      DOMAIN_EVENTS_CHANNELS.BARBER,
      expect.any(Function),
    );
  });

  it('deactivates the barber when a user leaves the BARBER role', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-1',
      channel: 'x',
      payload: {
        name: 'UserRoleChanged',
        occurredAt: new Date(),
        payload: {
          userId: 'user-1',
          previousRole: 'BARBER',
          newRole: 'CLIENT',
        },
      },
    });

    expect(deactivateBarberUseCase.execute).toHaveBeenCalledWith({
      barberId: 'user-1',
    });
  });

  it('ignores events other than UserRoleChanged', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-2',
      channel: 'x',
      payload: {
        name: 'PasswordChanged',
        occurredAt: new Date(),
        payload: { name: 'Jane' },
      },
    });

    expect(deactivateBarberUseCase.execute).not.toHaveBeenCalled();
  });

  it('ignores a role change whose previous role was not BARBER', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-3',
      channel: 'x',
      payload: {
        name: 'UserRoleChanged',
        occurredAt: new Date(),
        payload: {
          userId: 'user-1',
          previousRole: 'CLIENT',
          newRole: 'ADMIN',
        },
      },
    });

    expect(deactivateBarberUseCase.execute).not.toHaveBeenCalled();
  });

  it('ignores a role change whose new role is BARBER', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-4',
      channel: 'x',
      payload: {
        name: 'UserRoleChanged',
        occurredAt: new Date(),
        payload: {
          userId: 'user-1',
          previousRole: 'BARBER',
          newRole: 'BARBER',
        },
      },
    });

    expect(deactivateBarberUseCase.execute).not.toHaveBeenCalled();
  });
});
