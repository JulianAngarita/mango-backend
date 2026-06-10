import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PaginationDto } from '../dtos/pagination.dto';

/**
 * ParsePaginationPipe — transforma y valida los query params
 * de paginación antes de que lleguen al controller.
 *
 * Uso en controllers:
 *   @Get()
 *   findAll(@Query(ParsePaginationPipe) pagination: PaginationDto) { ... }
 *
 * Aplica límites de seguridad para evitar queries excesivamente grandes.
 */
@Injectable()
export class ParsePaginationPipe implements PipeTransform<Record<string, string>, PaginationDto> {
  private readonly MAX_LIMIT = 100;
  private readonly DEFAULT_LIMIT = 20;
  private readonly DEFAULT_PAGE  = 1;

  transform(query: Record<string, string>): PaginationDto {
    const dto = new PaginationDto();

    dto.page  = this.parsePositiveInt(query.page,  this.DEFAULT_PAGE,  'page');
    dto.limit = this.parsePositiveInt(query.limit, this.DEFAULT_LIMIT, 'limit');
    dto.sortOrder = (query.sortOrder === 'asc' || query.sortOrder === 'desc')
      ? query.sortOrder
      : 'desc';

    if (dto.limit > this.MAX_LIMIT) {
      throw new BadRequestException(
        `El parámetro limit no puede superar ${this.MAX_LIMIT}`,
      );
    }

    if (query.sortBy) dto.sortBy = query.sortBy;

    return dto;
  }

  private parsePositiveInt(
    value: string | undefined,
    fallback: number,
    field: string,
  ): number {
    if (value === undefined || value === '') return fallback;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new BadRequestException(
        `El parámetro ${field} debe ser un número entero positivo`,
      );
    }
    return parsed;
  }
}