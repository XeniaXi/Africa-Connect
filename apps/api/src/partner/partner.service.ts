import { Injectable } from '@nestjs/common';

// TODO: Implement partner API key authentication
// TODO: Implement upsert single business from partner payload (PartnerUpsertPayload)
// TODO: Implement batch upsert endpoint (up to 500 records per call)
// TODO: Trigger trust score computation on every upsert
// TODO: Record SyncLog on batch completion
// TODO: Emit AuditLog on every write with actorType=PARTNER
// TODO: Enforce row-level tenant isolation before any partner goes live

@Injectable()
export class PartnerService {}
