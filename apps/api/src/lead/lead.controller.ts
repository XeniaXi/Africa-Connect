import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadService } from './lead.service';

// TODO: POST /leads            — create lead (called by MCP create_lead tool)
// TODO: GET  /leads/:id        — get lead details
// TODO: PATCH /leads/:id/status — update lead status (business owner)
// TODO: GET  /leads?businessId= — list leads for a business (authenticated)

@ApiTags('leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}
}
