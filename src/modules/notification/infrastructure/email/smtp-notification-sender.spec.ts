import { createTransport } from 'nodemailer';

import { NotificationDeliveryError } from './errors/notification-delivery.error';
import { SmtpNotificationSender } from './smtp-notification-sender';
import { EnvConfig } from '../../../../shared/config/env.config';

jest.mock('nodemailer');

describe('SmtpNotificationSender', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  function buildSender(
    overrides: Partial<EnvConfig> = {},
  ): SmtpNotificationSender {
    const envConfig = {
      smtpHost: 'localhost',
      smtpPort: 1025,
      smtpSecure: false,
      smtpUser: undefined,
      smtpPassword: undefined,
      smtpFrom: 'ClickBeard <no-reply@clickbeard.local>',
      ...overrides,
    } as unknown as EnvConfig;

    return new SmtpNotificationSender(envConfig);
  }

  it('creates the transport from EnvConfig, with auth omitted when there is no SMTP user', () => {
    buildSender();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
    });
  });

  it('includes auth credentials when an SMTP user is configured', () => {
    buildSender({ smtpUser: 'user', smtpPassword: 'pass' });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: { user: 'user', pass: 'pass' } }),
    );
  });

  it('sends the notification via the transporter', async () => {
    sendMail.mockResolvedValue(undefined);
    const sender = buildSender();

    await sender.send({
      recipient: 'jane@example.com',
      subject: 'Hello',
      body: 'World',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'ClickBeard <no-reply@clickbeard.local>',
      to: 'jane@example.com',
      subject: 'Hello',
      text: 'World',
    });
  });

  it('wraps a transport failure in NotificationDeliveryError', async () => {
    sendMail.mockRejectedValue(new Error('SMTP connection refused'));
    const sender = buildSender();

    await expect(
      sender.send({ recipient: 'jane@example.com', subject: 'Hi', body: 'X' }),
    ).rejects.toThrow(NotificationDeliveryError);
  });
});
