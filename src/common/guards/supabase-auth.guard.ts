import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * SupabaseAuthGuard — guard global de autenticación.
 *
 * Aplicado como guard global en AppModule via APP_GUARD,
 * protege todos los endpoints por defecto.
 * Los endpoints marcados con @Public() se saltan la verificación.
 *
 * Flujo:
 *   1. Si el endpoint tiene @Public() → deja pasar
 *   2. Extrae el Bearer token del header Authorization
 *   3. Verifica el JWT con Supabase Admin (getUser)
 *   4. Adjunta el usuario al request para @CurrentUser()
 *   5. Si falla cualquier paso → 401 Unauthorized
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly supabase: SupabaseService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // ── ¿Es público? ──────────────────────────────────────────────────────
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

        // ── Verifica el JWT con Supabase ──────────────────────────────────────
        // getUser() valida la firma y expiración del JWT contra Supabase Auth.
        // Es más seguro que decodificar el JWT localmente.
        const { data, error } = await this.supabase
            .getClient()
            .auth.getUser(token);

        if (error || !data.user) {
            throw new UnauthorizedException('Token inválido o expirado');
        }

        // ── Adjunta el usuario al request ─────────────────────────────────────
        // El perfil extendido (xp, level, role, etc.) lo cargamos desde
        // la tabla profiles con el mismo id del usuario de Supabase Auth.
        const { data: profile, error: profileError } = await this.supabase
            .getClient()
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            throw new UnauthorizedException('Perfil de usuario no encontrado');
        }

        // Disponible en controllers via @CurrentUser()
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