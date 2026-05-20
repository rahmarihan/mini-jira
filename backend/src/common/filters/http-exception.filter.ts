// backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;

    if (!isHttpException) {
      this.logger.error(
        this.getErrorMessage(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? exception.getResponse()
      : this.getUnhandledErrorResponse(exception);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private getUnhandledErrorResponse(exception: unknown) {
    if (process.env.NODE_ENV === 'production') {
      return 'Internal server error';
    }
    return this.getErrorMessage(exception);
  }

  private getErrorMessage(exception: unknown) {
    return exception instanceof Error
      ? exception.message
      : 'Internal server error';
  }
}
