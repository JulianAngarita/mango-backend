import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SupabaseService } from '../../../supabase/supabase.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

/**
 * SupabaseJwtGuard — guard de autenticación local al módulo Auth.
 *
 * Funciona igual que el SupabaseAuthGuard global pero vive dentro del
 * módulo auth para los endpoints que necesitan verificar el token
 * sin depender del guard global (ej: /auth/reset-password, /auth/logout,
 * /auth/me, /auth/sync-profile).
 *
 * Verifica el JWT contra Supabase Auth y adjunta el usuario al request.
 * Los endpoints marcados con @Public() se saltan la verificación.
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const { data, error } = await this.supabase
      .getClient()
      .auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const { data: profile, error: profileError } = await (this.supabase.getClient() as any)
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException('Perfil de usuario no encontrado');
    }

    (request as any).user = profile;
    (request as any).accessToken = token;

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1] ?? null;
  }
}