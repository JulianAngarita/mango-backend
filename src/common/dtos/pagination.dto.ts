import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type SortOrder = 'asc' | 'desc';

export class PaginationDto {
    @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Número de página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Resultados por página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @ApiPropertyOptional({ description: 'Campo por el que ordenar', example: 'created_at' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder: SortOrder = 'desc';

    // ── Helpers de uso interno ──────────────────────────────────────────────
    get offset(): number {
        return (this.page - 1) * this.limit;
    }
}

export class PaginatedResponseDto<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };

    constructor(data: T[], total: number, pagination: PaginationDto) {
        const totalPages = Math.ceil(total / pagination.limit);
        this.data = data;
        this.meta = {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages,
            hasNextPage: pagination.page < totalPages,
            hasPrevPage: pagination.page > 1,
        };
    }
}