import { Injectable } from '@nestjs/common';
import { prisma } from '@connectafrica/database';

// Mirror of the ActorType enum from schema.prisma — avoids Prisma generated-type dependency at build time
type ActorType = 'USER' | 'PARTNER' | 'ADMIN' | 'AGENT' | 'SYSTEM';

export interface AuditLogInput {
  requestId?: string;
  actorId?: string;
  actorType?: ActorType;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  scopes?: string[];
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// AuditLog is immutable — records are never deleted or updated.
// Inject AuditService into any module that performs write operations.

@Injectable()
export class AuditService {
  async log(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        requestId: input.requestId,
        actorId: input.actorId,
        actorType: input.actorType ?? 'SYSTEM',
        tenantId: input.tenantId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        scopes: input.scopes ?? [],
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: (input.metadata ?? {}) as object,
      },
    });
  }
}
