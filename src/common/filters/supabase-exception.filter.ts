import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Estructura del error que devuelve el cliente de Supabase JS.
 * No extiende Error, por eso necesita su propio filtro.
 */
interface SupabaseError {
    code: string;
    message: string;
    details: string | null;
    hint: string | null;
}

/**
 * SupabaseExceptionFilter — captura errores del cliente de Supabase JS
 * que llegan sin ser envueltos en HttpException.
 *
 * Ocurre cuando un repositorio no captura el error de Supabase y lo deja
 * propagarse. Lo mapea al código HTTP apropiado según el código de error
 * de PostgreSQL.
 *
 * Aplicado globalmente en main.ts junto al HttpExceptionFilter.
 * El orden importa: este debe ir ANTES del HttpExceptionFilter.
 *
 * Códigos de error PostgreSQL más comunes:
 *   23505 → unique_violation       → 409 Conflict
 *   23503 → foreign_key_violation  → 400 Bad Request
 *   42501 → insufficient_privilege → 403 Forbidden (RLS)
 *   PGRST116 → no rows found       → 404 Not Found
 */
@Catch()
export class SupabaseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(SupabaseExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Solo maneja errores con estructura de Supabase/PostgREST
        if (!this.isSupabaseError(exception)) {
            // Deja que otros filtros lo capturen o devuelve 500 genérico
            this.logger.error(
                `Excepción no controlada en [${request.method}] ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );

            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Internal Server Error',
                message: ['Error interno del servidor'],
                path: request.url,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const { status, error } = this.mapSupabaseError(exception);

        this.logger.warn(
            `Supabase error [${exception.code}] en [${request.method}] ${request.url}: ${exception.message}`,
        );

        response.status(status).json({
            success: false,
            statusCode: status,
            error,
            message: [exception.message],
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }

    private isSupabaseError(exception: unknown): exception is SupabaseError {
        return (
            typeof exception === 'object' &&
            exception !== null &&
            'code' in exception &&
            'message' in exception
        );
    }

    private mapSupabaseError(error: SupabaseError): {
        status: number;
        error: string;
    } {
        switch (error.code) {
            // PostgreSQL: registro duplicado (unique constraint)
            case '23505':
                return { status: HttpStatus.CONFLICT, error: 'Conflict' };

            // PostgreSQL: violación de clave foránea
            case '23503':
                return { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' };

            // PostgreSQL: RLS bloqueó la operación (privilegio insuficiente)
            case '42501':
                return { status: HttpStatus.FORBIDDEN, error: 'Forbidden' };

            // PostgREST: no se encontraron filas (equivale a 404)
            case 'PGRST116':
                return { status: HttpStatus.NOT_FOUND, error: 'Not Found' };

            // PostgREST: JWT inválido o expirado
            case 'PGRST301':
                return { status: HttpStatus.UNAUTHORIZED, error: 'Unauthorized' };

            // PostgREST: parámetro inválido en la query
            case 'PGRST100':
            case 'PGRST102':
                return { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' };

            default:
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Internal Server Error',
                };
        }
    }
}