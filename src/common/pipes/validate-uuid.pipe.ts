import {
    PipeTransform,
    Injectable,
    BadRequestException,
    ArgumentMetadata,
} from '@nestjs/common';

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ValidateUuidPipe — valida que un parámetro de ruta sea un UUID v4 válido.
 *
 * Evita hacer queries a Supabase con IDs malformados que nunca
 * devolverán resultados y generarían errores de PostgreSQL.
 *
 * Uso en controllers:
 *   @Get(':id')
 *   findOne(@Param('id', ValidateUuidPipe) id: string) { ... }
 *
 *   // Con mensaje personalizado:
 *   @Delete(':memberId')
 *   remove(@Param('memberId', new ValidateUuidPipe('memberId')) id: string) { ... }
 */
@Injectable()
export class ValidateUuidPipe implements PipeTransform<string, string> {
    constructor(private readonly fieldName?: string) { }

    transform(value: string, metadata: ArgumentMetadata): string {
        if (!value || !UUID_REGEX.test(value)) {
            const field = this.fieldName ?? metadata.data ?? 'id';
            throw new BadRequestException(
                `El parámetro '${field}' debe ser un UUID válido`,
            );
        }
        return value;
    }
}