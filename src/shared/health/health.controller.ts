import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RedisHealthIndicator } from './indicators/redis.health-indicator';

/**
 * Unauthenticated on purpose — this is what an orchestrator (Docker,
 * k8s, a load balancer) polls to decide whether to route traffic to
 * this instance, so it can never depend on a caller already holding a
 * token.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly sequelizeIndicator: SequelizeHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Reports Postgres and Redis connectivity' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.sequelizeIndicator.pingCheck('database'),
      () => this.redisIndicator.pingCheck('redis'),
    ]);
  }
}
