export const ANALYTICS_REPOSITORY = Symbol('AnalyticsRepository');

export interface MetricSnapshot {
  key: string;
  value: number;
  updatedAt: Date;
}

/**
 * Projection store for counters maintained incrementally from domain
 * events (UserRegistered, AppointmentCreated, ...) once an event-driven
 * adapter is wired up. No use case depends on this yet — dashboard
 * queries currently read straight from the *MetricsQuery ports below —
 * but the port exists so a future event consumer can update snapshots
 * without any change to the application layer.
 */
export interface AnalyticsRepository {
  incrementCounter(
    key: string,
    occurredAt: Date,
    amount?: number,
  ): Promise<void>;
  getCounter(key: string): Promise<MetricSnapshot | null>;
}
