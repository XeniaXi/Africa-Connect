import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator';
import { prisma } from '@connectafrica/database';
import { createClient } from 'redis';

@ApiTags('health')
@Controller('healthz')
export class HealthController {
  @Get()
  @Public()   // health probes must never require auth
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness + dependency health check' })
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
      // Return 503 so Coolify / k8s stops routing traffic here
      throw Object.assign(new Error('Service degraded'), { statusCode: 503, body });
    }

    return body;
  }

  private async checkDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis(): Promise<void> {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const client = createClient({ url });
    try {
      await client.connect();
      await client.ping();
    } finally {
      await client.disconnect();
    }
  }
}
