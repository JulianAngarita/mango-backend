import { IsOptional, IsDateString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';


export class DateRangeDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio (ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate debe ser una fecha válida (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate debe ser una fecha válida (YYYY-MM-DD)' })
  @ValidateIf((o) => !!o.startDate)
  endDate?: string;

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Lanza BadRequestException si endDate es anterior a startDate. */
  validateRange(): void {
    if (this.startDate && this.endDate) {
      if (new Date(this.endDate) < new Date(this.startDate)) {
        throw new BadRequestException(
          'endDate no puede ser anterior a startDate',
        );
      }
    }
  }

  /** Devuelve el rango como objetos Date. */
  toDateObjects(): { start: Date | undefined; end: Date | undefined } {
    return {
      start: this.startDate ? new Date(this.startDate) : undefined,
      end:   this.endDate   ? new Date(this.endDate)   : undefined,
    };
  }

  /**
   * Devuelve el rango predeterminado si no se especifican fechas.
   * Por defecto: últimos 30 días.
   */
  withDefaults(days = 30): Required<Pick<DateRangeDto, 'startDate' | 'endDate'>> {
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    return {
      startDate: this.startDate ?? start.toISOString().split('T')[0],
      endDate:   this.endDate   ?? end.toISOString().split('T')[0],
    };
  }
}