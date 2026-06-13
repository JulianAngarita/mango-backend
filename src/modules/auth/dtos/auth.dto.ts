import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * RegisterDto — registro de nuevo usuario B2C (APP).
 *
 * El password nunca llega a nuestra BD — se envía directamente
 * a Supabase Auth, que lo hashea con bcrypt internamente.
 * Nosotros solo guardamos el perfil extendido en la tabla profiles.
 */
export class RegisterDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    { message: 'La contraseña debe incluir mayúsculas, minúsculas y números' },
  )
  password!: string;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  full_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

/**
 * LoginDto — inicio de sesión con email y password.
 */
export class LoginDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password!: string;
}

/**
 * OAuthDto — login/registro vía OAuth (Google o Apple).
 * El token ya fue generado por Supabase Auth en el cliente.
 */
export class OAuthCallbackDto {
  @IsString()
  access_token!: string;

  @IsString()
  refresh_token!: string;
}

/**
 * RefreshTokenDto — renovar sesión con refresh token.
 */
export class RefreshTokenDto {
  @IsString()
  refresh_token!: string;
}

/**
 * ForgotPasswordDto — solicitar email de recuperación.
 */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email!: string;
}

/**
 * ResetPasswordDto — cambiar contraseña con token de recuperación.
 */
export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    { message: 'La contraseña debe incluir mayúsculas, minúsculas y números' },
  )
  new_password!: string;
}

/**
 * CrmRegisterDto — registro de usuario del CRM (gym_admin o trainer).
 * Usado en el flujo de onboarding B2B (C23) y en invitaciones de staff (C02).
 */
export class CrmRegisterDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    { message: 'La contraseña debe incluir mayúsculas, minúsculas y números' },
  )
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  full_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsEnum(['gym_admin', 'trainer'], {
    message: 'El rol debe ser gym_admin o trainer',
  })
  role!: 'gym_admin' | 'trainer';

  /** ID del gimnasio al que se asocia (requerido para trainer, opcional para gym_admin nuevo) */
  @IsOptional()
  @IsString()
  gym_id?: string;
}