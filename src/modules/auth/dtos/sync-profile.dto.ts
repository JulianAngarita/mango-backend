import { IsString, IsEmail, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * SyncProfileDto — sincroniza el perfil del usuario tras login OAuth.
 *
 * Cuando un usuario entra por Google o Apple, el cliente envía
 * los datos del proveedor para que el backend actualice el perfil
 * si hay información nueva (avatar, nombre del proveedor, etc.).
 *
 * Solo actualiza campos que vengan explícitamente — nunca sobrescribe
 * campos que el usuario haya editado manualmente.
 */
export class SyncProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  full_name?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email?: string;

  /** Token FCM del dispositivo para notificaciones push */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fcm_token?: string;

  /** Proveedor OAuth que generó el login (google, apple) */
  @IsOptional()
  @IsString()
  provider?: string;
}