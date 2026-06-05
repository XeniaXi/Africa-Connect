import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator';
import { ServiceUnavailableException } from '@nestjs/common';
import { prisma } from '@connectafrica/database';
import { createClient } from 'redis';

@ApiTags('health')
@Controller('healthz')
export class HealthController {
  /** Docker / Coolify liveness probe — no external dependencies */
  @Get('live')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe — returns 200 as long as the process is alive' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Deep readiness check — verifies DB and Redis connectivity */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check — verifies DB and Redis connectivity' })
  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const db     = checks[0];
    const redis  = checks[1];

    const dbOk    = db.status    === 'fulfilled';
    const redisOk = redis.status === 'fulfilled';
    const healthy = dbOk && redisOk;

    const body = {
      status:    healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk    ? 'ok' : (db    as PromiseRejectedResult).reason?.message ?? 'error',
        redis:    redisOk ? 'ok' : (redis as PromiseRejectedResult).reason?.message ?? 'error',
      },
    };

    if (!healthy) {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }

  private async checkDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis(): Promise<void> {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    // reconnectStrategy: false — prevents background reconnection timers that
    // would emit unhandled 'error' events and crash the Node.js process if Redis
    // is temporarily unreachable.
    const client = createClient({
      url,
      socket: { reconnectStrategy: false },
    });
    // Swallow errors on the client instance itself — the error will surface
    // through the connect() / ping() promise rejection instead.
    client.on('error', () => { /* handled via promise rejection below */ });
    try {
      await client.connect();
      await client.ping();
    } finally {
      await client.disconnect().catch(() => { /* ignore disconnect errors */ });
    }
  }
}
