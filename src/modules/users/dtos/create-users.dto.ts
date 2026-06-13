import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../supabase/supabase.types';

/**
 * CreateUserDto — creación manual de usuario desde el CRM.
 * Usado por gym_admin para registrar miembros en recepción (C04).
 *
 * Campos cifrados antes de insertar en BD:
 *   full_name, phone, address, birth_date
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  full_name!: string;

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
  @IsEnum(['user', 'gym_admin', 'trainer'] as const)
  role?: Extract<UserRole, 'user' | 'gym_admin' | 'trainer'>;

  @IsOptional()
  @IsString()
  gym_id?: string;

  /**
   * Si se incluye password, se crea la cuenta en Supabase Auth.
   * Si no, se crea solo el perfil (el usuario recibirá invitación por email).
   */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  })
  password?: string;
}