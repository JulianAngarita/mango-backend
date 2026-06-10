import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HttpExceptionFilter — captura todas las HttpException y las
 * transforma al formato estándar de respuesta de error de la API.
 *
 * Aplicado globalmente en main.ts:
 *   app.useGlobalFilters(new HttpExceptionFilter());
 *
 * Formato de salida:
 * {
 *   "success":    false,
 *   "statusCode": 404,
 *   "error":      "Not Found",
 *   "message":    "Hábito no encontrado",
 *   "path":       "/api/v1/habits/abc",
 *   "timestamp":  "2025-01-01T00:00:00.000Z"
 * }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        // NestJS puede devolver string o { message, error } en el response
        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message ?? exception.message;

        const error =
            typeof exceptionResponse === 'object'
                ? (exceptionResponse as any).error
                : HttpStatus[status];

        // Log de errores 5xx — los 4xx son errores del cliente, no los logueamos
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `[${request.method}] ${request.url} → ${status}`,
                exception.stack,
            );
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            error,
            message: Array.isArray(message) ? message : [message],
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}