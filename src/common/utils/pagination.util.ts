import { PaginationDto, PaginatedResponseDto } from '../dtos/pagination.dto';

/**
 * buildSupabaseRange — convierte PaginationDto al rango que
 * espera el cliente de Supabase JS (.range(from, to)).
 *
 * Uso en repositorios:
 *   const { from, to } = buildSupabaseRange(pagination);
 *   const { data, count } = await client
 *     .from('habits')
 *     .select('*', { count: 'exact' })
 *     .range(from, to);
 */
export function buildSupabaseRange(pagination: PaginationDto): {
  from: number;
  to:   number;
} {
  const from = (pagination.page - 1) * pagination.limit;
  const to   = from + pagination.limit - 1;
  return { from, to };
}

/**
 * buildSupabaseOrder — devuelve el campo y dirección de orden
 * para .order() del cliente de Supabase.
 *
 * Uso en repositorios:
 *   const { column, ascending } = buildSupabaseOrder(pagination, 'created_at');
 *   query.order(column, { ascending });
 */
export function buildSupabaseOrder(
  pagination: PaginationDto,
  defaultColumn = 'created_at',
): { column: string; ascending: boolean } {
  return {
    column:    pagination.sortBy ?? defaultColumn,
    ascending: pagination.sortOrder === 'asc',
  };
}

/**
 * paginate — helper que aplica range + order a una query de Supabase
 * y devuelve un PaginatedResponseDto listo para el controller.
 *
 * Uso en repositorios:
 *   return paginate(
 *     supabase.from('habits').select('*', { count: 'exact' }).eq('user_id', userId),
 *     pagination,
 *   );
 */
export async function paginate<T>(
  query: any,
  pagination: PaginationDto,
  defaultSort = 'created_at',
): Promise<PaginatedResponseDto<T>> {
  const { from, to }        = buildSupabaseRange(pagination);
  const { column, ascending } = buildSupabaseOrder(pagination, defaultSort);

  const { data, count, error } = await query
    .order(column, { ascending })
    .range(from, to);

  if (error) throw error;

  return new PaginatedResponseDto<T>(
    (data as T[]) ?? [],
    count ?? 0,
    pagination,
  );
}