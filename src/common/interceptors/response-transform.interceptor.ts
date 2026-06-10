import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    HttpStatus,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
/**
 * ResponseTransformInterceptor — envuelve automáticamente todas las
 * respuestas exitosas de los controllers en el formato estándar de la API.
 *
 * Aplicado globalmente en main.ts:
 *   app.useGlobalInterceptors(new ResponseTransformInterceptor());
 *
 * Los controllers devuelven sus datos directamente (sin construir el wrapper)
 * y este interceptor los envuelve antes de enviarlos al cliente.
 *
 * Entrada (lo que devuelve el controller):
 *   return { id: '123', name: 'Sentadilla' };
 *
 * Salida (lo que recibe el cliente):
 * {
 *   "success":    true,
 *   "statusCode": 200,
 *   "message":    "OK",
 *   "data":       { "id": "123", "name": "Sentadilla" },
 *   "timestamp":  "2025-01-01T00:00:00.000Z"
 * }
 *
 * Casos especiales:
 *   - Si el controller ya devuelve un objeto con { success, statusCode },
 *     se asume que ya está formateado y se pasa tal cual.
 *   - Las respuestas 204 No Content no incluyen el campo data.
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode as number;

        return next.handle().pipe(
            map((data: unknown) => {
                // Si ya tiene el formato estándar, no lo transformamos
                if (this.isAlreadyFormatted(data)) return data;

                // 204 No Content — sin body
                if (statusCode === HttpStatus.NO_CONTENT) {
                    return {
                        success: true,
                        statusCode,
                        message: 'Operación completada',
                        timestamp: new Date().toISOString(),
                    };
                }

                return {
                    success: true,
                    statusCode,
                    message: this.resolveMessage(statusCode),
                    data: data ?? null,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }

    private isAlreadyFormatted(data: unknown): boolean {
        return (
            typeof data === 'object' &&
            data !== null &&
            'success' in data &&
            'statusCode' in data
        );
    }

    private resolveMessage(statusCode: number): string {
        switch (statusCode) {
            case HttpStatus.CREATED: return 'Creado correctamente';
            case HttpStatus.NO_CONTENT: return 'Operación completada';
            default: return 'OK';
        }
    }
}