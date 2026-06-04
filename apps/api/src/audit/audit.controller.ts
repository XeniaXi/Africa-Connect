import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';

// TODO: GET /admin/audit-logs              — paginated audit log query (ADMIN scope)
// TODO: GET /admin/audit-logs?actorId=     — filter by actor
// TODO: GET /admin/audit-logs?resource=    — filter by resource type
// TODO: GET /admin/audit-logs?resourceId=  — filter by specific resource ID

@ApiTags('audit')
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
}
