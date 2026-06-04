import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PartnerService } from './partner.service';

// TODO: POST /partner/businesses       — upsert single business (partner API key required)
// TODO: POST /partner/businesses/batch — batch upsert up to 500 (partner API key required)
// TODO: GET  /partner/businesses       — list partner's own businesses
// TODO: GET  /partner/sync-logs        — list sync history for this partner
// TODO: POST /partner/webhook/test     — trigger test webhook delivery

@ApiTags('partner')
@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}
}
