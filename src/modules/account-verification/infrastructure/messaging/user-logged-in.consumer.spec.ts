import { UserLoggedInConsumer } from './user-logged-in.consumer';
import { GenerateVerificationCodeUseCase } from '../../core/application/use-cases/generate-verification-code.use-case';
import { DOMAIN_EVENTS_CHANNELS } from '../../../../shared/queue/domain-events.channel';

import type { MessageQueue } from '../../../../shared/application/ports/message-queue.port';

describe('UserLoggedInConsumer', () => {
  let messageQueue: jest.Mocked<MessageQueue>;
  let generateVerificationCodeUseCase: jest.Mocked<GenerateVerificationCodeUseCase>;
  let consumer: UserLoggedInConsumer;

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
    generateVerificationCodeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GenerateVerificationCodeUseCase>;
    consumer = new UserLoggedInConsumer(
      messageQueue,
      generateVerificationCodeUseCase,
    );
  });

  it("subscribes to Account Verification's own domain-events channel", () => {
    consumer.onModuleInit();

    expect(messageQueue.consume).toHaveBeenCalledWith(
      DOMAIN_EVENTS_CHANNELS.ACCOUNT_VERIFICATION,
      expect.any(Function),
    );
  });

  it('generates a verification code when a UserLoggedIn event arrives', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-1',
      channel: 'x',
      payload: {
        name: 'UserLoggedIn',
        occurredAt: new Date(),
        recipientEmail: 'jane@example.com',
        payload: { userId: 'user-1', name: 'Jane Doe' },
      },
    });

    expect(generateVerificationCodeUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
  });

  it('ignores events other than UserLoggedIn', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-1',
      channel: 'x',
      payload: {
        name: 'PasswordChanged',
        occurredAt: new Date(),
        recipientEmail: 'jane@example.com',
        payload: { name: 'Jane' },
      },
    });

    expect(generateVerificationCodeUseCase.execute).not.toHaveBeenCalled();
  });

  it('ignores a UserLoggedIn event with no recipientEmail', async () => {
    const handler = captureHandler();

    await handler({
      id: 'job-1',
      channel: 'x',
      payload: {
        name: 'UserLoggedIn',
        occurredAt: new Date(),
        payload: { userId: 'user-1', name: 'Jane Doe' },
      },
    });

    expect(generateVerificationCodeUseCase.execute).not.toHaveBeenCalled();
  });
});
