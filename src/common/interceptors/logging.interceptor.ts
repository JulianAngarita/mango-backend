import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * LoggingInterceptor — loguea cada request con método, ruta,
 * usuario, duración y status code.
 *
 * En producción Pino ya logea los requests vía pino-http en main.ts,
 * por lo que este interceptor añade el userId y la duración
 * de forma estructurada para facilitar el debugging.
 *
 * Salida de ejemplo:
 *   [NestJS] POST /api/v1/habits/log | user: abc-123 | 42ms
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, url } = request;
        const userId = (request as any).user?.id ?? 'anonymous';
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    this.logger.log(`${method} ${url} | user: ${userId} | ${duration}ms`);
                },
                error: (err) => {
                    const duration = Date.now() - startTime;
                    this.logger.warn(
                        `${method} ${url} | user: ${userId} | ${duration}ms | error: ${err?.message}`,
                    );
                },
            }),
        );
    }
}