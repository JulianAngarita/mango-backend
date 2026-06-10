import { HttpStatus } from '@nestjs/common';

/**
 * Estructura estándar de todas las respuestas de la API.
 *
 * El ResponseTransformInterceptor envuelve automáticamente
 * cualquier valor devuelto por un controller en este formato,
 * por lo que los controllers no necesitan construirlo a mano.
 *
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": { ... },
 *   "message": "OK",
 *   "timestamp": "2025-01-01T00:00:00.000Z"
 * }
 *
 * Respuesta de error (gestionada por HttpExceptionFilter):
 * {
 *   "success": false,
 *   "statusCode": 404,
 *   "error": "Not Found",
 *   "message": "Hábito no encontrado",
 *   "timestamp": "2025-01-01T00:00:00.000Z"
 * }
 */
export class ApiResponseDto<T = unknown> {
    success!: boolean;
    statusCode!: number;
    message!: string;
    data?: T;
    error?: string;
    timestamp!: string;

    private constructor(partial: Partial<ApiResponseDto<T>>) {
        Object.assign(this, partial);
        this.timestamp = new Date().toISOString();
    }

    static ok<T>(data: T, message = 'OK'): ApiResponseDto<T> {
        return new ApiResponseDto<T>({
            success: true,
            statusCode: HttpStatus.OK,
            message,
            data,
        });
    }

    static created<T>(data: T, message = 'Creado correctamente'): ApiResponseDto<T> {
        return new ApiResponseDto<T>({
            success: true,
            statusCode: HttpStatus.CREATED,
            message,
            data,
        });
    }

    static noContent(message = 'Eliminado correctamente'): ApiResponseDto<null> {
        return new ApiResponseDto<null>({
            success: true,
            statusCode: HttpStatus.NO_CONTENT,
            message,
            data: null,
        });
    }

    static error(
        statusCode: number,
        message: string,
        error?: string,
    ): ApiResponseDto<null> {
        return new ApiResponseDto<null>({
            success: false,
            statusCode,
            message,
            error,
            data: null,
        });
    }
}