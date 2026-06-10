import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../supabase/supabase.types';

/**
 * RolesGuard — verifica que el usuario autenticado tenga
 * alguno de los roles requeridos por el endpoint.
 *
 * IMPORTANTE: debe usarse DESPUÉS de SupabaseAuthGuard,
 * ya que depende de que request.user esté cargado.
 *
 * Si el endpoint no tiene @Roles(), el guard deja pasar.
 *
 * Uso:
 *   @Roles('gym_admin', 'super_admin')
 *   @UseGuards(SupabaseAuthGuard, RolesGuard)
 *   @Post('memberships')
 *   create() { ... }
 *
 * Jerarquía implícita:
 *   super_admin puede acceder a todo, sin importar los roles requeridos.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Sin @Roles() → libre para cualquier usuario autenticado
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!user) return false;

        // super_admin siempre puede
        if (user.role === 'super_admin') return true;

        const hasRole = requiredRoles.includes(user.role as UserRole);

        if (!hasRole) {
            throw new ForbiddenException(
                `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}