import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PartnerModule } from '../partner/partner.module';
import { AuditModule } from '../audit/audit.module';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { IngestScheduler } from './ingest.scheduler';

@Module({
  imports: [ScheduleModule.forRoot(), PartnerModule, AuditModule],
  controllers: [IngestController],
  providers: [IngestService, IngestScheduler],
})
export class IngestModule {}
