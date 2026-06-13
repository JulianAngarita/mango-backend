import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole, UserPlan } from '../../../supabase/supabase.types';

/**
 * UserFilterDto — filtros para listar usuarios desde el CRM.
 * Usado en GET /users/gym/:gymId con query params.
 */
export class UserFilterDto {
  @IsOptional()
  @IsEnum(['user', 'gym_admin', 'trainer', 'super_admin'] as const)
  role?: UserRole;

  @IsOptional()
  @IsEnum(['free', 'premium'] as const)
  plan?: UserPlan;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string).trim())
  search?: string;   // busca por full_name (parcial) — descifrado en el servicio

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['created_at', 'full_name', 'xp_total', 'level'] as const)
  sort_by?: 'created_at' | 'full_name' | 'xp_total' | 'level' = 'created_at';

  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sort_order?: 'asc' | 'desc' = 'desc';
}