import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Generates a UUID per request and attaches it to both incoming and outgoing
 * headers as X-Request-ID. Downstream services (MCP gateway, audit logs)
 * should forward this ID to maintain a full trace across the system.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();

    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
