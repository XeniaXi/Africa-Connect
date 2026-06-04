import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const requestId = (request.headers?.['x-request-id'] as string) ?? 'unknown';
    const path = httpAdapter.getRequestUrl(request) ?? '/';
    const method = httpAdapter.getRequestMethod(request) ?? 'UNKNOWN';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as { message?: string }).message ?? message;
        details = (res as { errors?: unknown }).errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if (process.env.NODE_ENV !== 'production') {
        details = exception.stack;
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${method} ${path} → ${statusCode} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${method} ${path} → ${statusCode} [${requestId}]: ${message}`);
    }

    httpAdapter.reply(response, {
      statusCode,
      message,
      ...(details ? { details } : {}),
      requestId,
      timestamp: new Date().toISOString(),
      path,
    }, statusCode);
  }
}
