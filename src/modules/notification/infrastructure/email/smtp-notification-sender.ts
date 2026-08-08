import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

import { renderBrandedEmailHtml } from './branded-email-html';
import { NotificationDeliveryError } from './errors/notification-delivery.error';
import {
  NotificationSender,
  OutgoingNotification,
} from '../../core/application/ports/notification-sender.port';
import { EnvConfig } from '../../../../shared/config/env.config';

@Injectable()
export class SmtpNotificationSender implements NotificationSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(envConfig: EnvConfig) {
    this.from = envConfig.smtpFrom;
    this.transporter = createTransport({
      host: envConfig.smtpHost,
      port: envConfig.smtpPort,
      secure: envConfig.smtpSecure,
      auth: envConfig.smtpUser
        ? { user: envConfig.smtpUser, pass: envConfig.smtpPassword }
        : undefined,
    });
  }

  async send(notification: OutgoingNotification): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: notification.recipient,
        subject: notification.subject,
        text: notification.body,
        html: renderBrandedEmailHtml({
          body: notification.body,
          language: notification.language,
        }),
      });
    } catch (error) {
      throw new NotificationDeliveryError(error);
    }
  }
}
