import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BusinessModule } from './business/business.module';
import { SearchModule } from './search/search.module';
import { ClaimModule } from './claim/claim.module';
import { PartnerModule } from './partner/partner.module';
import { VerificationModule } from './verification/verification.module';
import { LeadModule } from './lead/lead.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    HealthModule,
    AuditModule,
    BusinessModule,
    SearchModule,
    ClaimModule,
    PartnerModule,
    VerificationModule,
    LeadModule,
  ],
})
export class AppModule {}
