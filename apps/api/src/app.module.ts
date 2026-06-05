import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './common/auth/auth.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { BusinessModule } from './business/business.module';
import { SearchModule } from './search/search.module';
import { ClaimModule } from './claim/claim.module';
import { PartnerModule } from './partner/partner.module';
import { VerificationModule } from './verification/verification.module';
import { LeadModule } from './lead/lead.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { IngestModule } from './ingest/ingest.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,       // global — JWT guard applied to all routes by default
    HealthModule,
    AuditModule,
    BusinessModule,
    SearchModule,
    ClaimModule,
    PartnerModule,
    VerificationModule,
    LeadModule,
    IngestModule,
    AdminModule,
  ],
  providers: [
    // Global exception filter — consistent error shape across all endpoints
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
