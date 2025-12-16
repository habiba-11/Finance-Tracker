import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, params, body } = request;
    const requestId = request.headers['x-request-id'] || 'N/A';
    const now = Date.now();

    // Log incoming request
    this.logger.log(
      `[${requestId}] ${method} ${url} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)}`,
    );

    // Log request body (excluding sensitive data)
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = { ...body };
      if (sanitizedBody.password) {
        sanitizedBody.password = '***';
      }
      if (sanitizedBody.passwordHash) {
        sanitizedBody.passwordHash = '***';
      }
      this.logger.debug(`[${requestId}] Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `[${requestId}] ${method} ${url} - ${responseTime}ms - Success`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `[${requestId}] ${method} ${url} - ${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}

