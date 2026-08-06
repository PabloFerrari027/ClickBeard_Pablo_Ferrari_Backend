export const MESSAGE_QUEUE = Symbol('MessageQueue');

export interface QueueMessage<Payload = unknown> {
  id: string;
  channel: string;
  payload: Payload;
}

/**
 * Lower-level async transport contract. A concrete EventBus adapter uses
 * this internally to move published events off the request path; Core use
 * cases never depend on it directly, only on EventBus.
 */
export interface MessageQueue {
  enqueue<Payload>(channel: string, payload: Payload): Promise<void>;
  consume<Payload>(
    channel: string,
    handler: (message: QueueMessage<Payload>) => Promise<void>,
  ): void;
}
