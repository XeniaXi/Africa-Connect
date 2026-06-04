import { Injectable } from '@nestjs/common';

// TODO: Implement createLead — persists Lead record, returns id
// TODO: Implement lead notification dispatch (WhatsApp / SMS to business owner)
// TODO: Implement updateLeadStatus — CONTACTED, QUALIFIED, CONVERTED, CLOSED
// TODO: Implement lead analytics aggregation per business
// TODO: Emit AuditLog on every lead creation (actorType from X-Actor-Type header)

@Injectable()
export class LeadService {}
