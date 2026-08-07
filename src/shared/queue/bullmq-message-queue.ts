import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConnectionOptions } from 'bullmq';
import { Queue, Worker } from 'bullmq';

import { MessageQueueUnavailableError } from './errors/message-queue-unavailable.error';
import { QueueConfig } from '../config/queue.config';

import type {
  MessageQueue,
  QueueMessage,
} from '../application/ports/message-queue.port';

/**
 * One BullMQ `Queue` (producer) and, once `consume` is called, one
 * `Worker` (consumer) per channel — channels map 1:1 to BullMQ queue
 * names, created lazily and cached so repeated `enqueue`/`consume`
 * calls for the same channel reuse the same connection resources.
 */
@Injectable()
export class BullMqMessageQueue implements MessageQueue, OnModuleDestroy {
  private readonly connection: ConnectionOptions;
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();

  constructor(queueConfig: QueueConfig) {
    this.connection = queueConfig.createQueueOptions().connection;
  }

  async enqueue<Payload>(channel: string, payload: Payload): Promise<void> {
    try {
      await this.getOrCreateQueue(channel).add(channel, payload);
    } catch (error) {
      throw new MessageQueueUnavailableError(error);
    }
  }

  consume<Payload>(
    channel: string,
    handler: (message: QueueMessage<Payload>) => Promise<void>,
  ): void {
    if (this.workers.has(channel)) {
      return;
    }

    const worker = new Worker<Payload>(
      channel,
      async (job) => {
        await handler({
          id: String(job.id),
          channel,
          payload: job.data,
        });
      },
      { connection: this.connection },
    );

    this.workers.set(channel, worker);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      ...Array.from(this.queues.values(), (queue) => queue.close()),
      ...Array.from(this.workers.values(), (worker) => worker.close()),
    ]);
  }

  private getOrCreateQueue(channel: string): Queue {
    const existing = this.queues.get(channel);

    if (existing) {
      return existing;
    }

    const queue = new Queue(channel, { connection: this.connection });

    this.queues.set(channel, queue);

    return queue;
  }
}
