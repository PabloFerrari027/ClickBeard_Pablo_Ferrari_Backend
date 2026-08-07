import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

import { InvalidateExpiredVerificationCodesUseCase } from '../../core/application/use-cases/invalidate-expired-verification-codes.use-case';
import { QueueConfig } from '../../../../shared/config/queue.config';

const SWEEP_QUEUE_NAME = 'account-verification.expired-codes-sweep';
const SWEEP_JOB_ID = 'sweep';
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

/**
 * `InvalidateExpiredVerificationCodesUseCase`'s own doc comment
 * anticipates this: "a maintenance use case for a future scheduler".
 * Runs it on a recurring BullMQ job rather than a plain interval/
 * `@Cron()` timer — BullMQ's `repeat` option is deduplicated by the
 * queue itself (keyed by `jobId`), so horizontally scaling this app to
 * multiple instances never runs the sweep more than once per interval;
 * a per-process timer would fire independently on every instance.
 */
@Injectable()
export class ExpiredCodesSweepScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ExpiredCodesSweepScheduler.name);
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly queueConfig: QueueConfig,
    private readonly invalidateExpiredVerificationCodesUseCase: InvalidateExpiredVerificationCodesUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = this.queueConfig.createQueueOptions().connection;

    this.queue = new Queue(SWEEP_QUEUE_NAME, { connection });
    this.worker = new Worker(
      SWEEP_QUEUE_NAME,
      async () => {
        const { invalidatedCount } =
          await this.invalidateExpiredVerificationCodesUseCase.execute();

        if (invalidatedCount > 0) {
          this.logger.log(
            `Invalidated ${invalidatedCount} expired verification code(s).`,
          );
        }
      },
      { connection },
    );

    await this.queue.add(
      SWEEP_JOB_ID,
      {},
      { repeat: { every: SWEEP_INTERVAL_MS }, jobId: SWEEP_JOB_ID },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}
