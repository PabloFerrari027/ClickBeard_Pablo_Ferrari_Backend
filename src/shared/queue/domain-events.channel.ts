/**
 * One channel per subscriber, not one shared channel for everyone:
 * `BullMqMessageQueue.consume` maps a channel 1:1 to a BullMQ queue,
 * and BullMQ queues are competing-consumer by design — a second
 * `consume()` call on a channel that already has a worker would never
 * receive anything. `QueueEventBus.publish` enqueues every event onto
 * every channel below so each subscriber gets its own full copy of the
 * stream (the same fan-out shape as one SNS topic feeding several SQS
 * queues). Core code never sees any of this; only the producer
 * (`QueueEventBus`) and each subscriber's own infrastructure consumer
 * do.
 */
export const DOMAIN_EVENTS_CHANNELS = {
  NOTIFICATIONS: 'domain-events.notifications',
  ACCOUNT_VERIFICATION: 'domain-events.account-verification',
  SCHEDULING: 'domain-events.scheduling',
  BARBER: 'domain-events.barber',
} as const;

export type DomainEventsChannel =
  (typeof DOMAIN_EVENTS_CHANNELS)[keyof typeof DOMAIN_EVENTS_CHANNELS];
