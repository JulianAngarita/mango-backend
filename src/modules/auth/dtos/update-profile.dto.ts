import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsUrl,
  IsDateString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * UpdateProfileDto — actualización de datos del perfil autenticado.
 *
 * A diferencia de UpdateUserDto (módulo users), este DTO vive en auth
 * porque también permite cambiar el email y la contraseña, operaciones
 * que afectan a Supabase Auth además del perfil en BD.
 *
 * Campos cifrados antes de guardar: full_name, phone, address, birth_date, bio.
 */
export class UpdateProfileDto {
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
 * ChangePasswordDto — cambio de contraseña estando autenticado.
 * Requiere la contraseña actual para confirmar la identidad.
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  current_password!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  })
  new_password!: string;
}

/**
 * ChangeEmailDto — cambio de email estando autenticado.
 * Supabase enviará un email de confirmación al nuevo correo.
 */
export class ChangeEmailDto {
  @IsString()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  new_email!: string;
}