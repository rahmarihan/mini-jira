import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * M5 (optional) — Logs HTTP method, path, status code, and duration.
 * Register globally in main.ts when ready:
 *   app.useGlobalInterceptors(new LoggingInterceptor());
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method?: string;
      url?: string;
    }>();
    const { method = 'UNKNOWN', url = '' } = req;
    const started = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<{ statusCode?: number }>();
        const status = res.statusCode ?? 0;
        const ms = Date.now() - started;
        this.logger.log(`${method} ${url} ${status} +${ms}ms`);
      }),
    );
  }
}
