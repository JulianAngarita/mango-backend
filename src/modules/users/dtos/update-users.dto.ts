import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsUrl,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../supabase/supabase.types';

/**
 * UpdateUserDto — actualización de perfil propio (APP y CRM).
 * Todos los campos son opcionales (PATCH semántico).
 *
 * Campos cifrados antes de guardar en BD:
 *   full_name, phone, address, birth_date, bio
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fcm_token?: string;
}

/**
 * UpdateUserAdminDto — extensión para actualizaciones desde el CRM.
 * Solo gym_admin y super_admin pueden usar estos campos adicionales.
 */
export class UpdateUserAdminDto extends UpdateUserDto {
  @IsOptional()
  @IsEnum(['user', 'gym_admin', 'trainer', 'super_admin'] as const)
  role?: UserRole;

  @IsOptional()
  @IsString()
  gym_id?: string;
}