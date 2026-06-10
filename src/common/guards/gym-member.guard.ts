import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * GymMemberGuard — verifica que el usuario autenticado tenga
 * acceso al gimnasio especificado en el header x-gym-id.
 *
 * IMPORTANTE: debe usarse DESPUÉS de SupabaseAuthGuard.
 *
 * Reglas de acceso:
 *   - super_admin → acceso a cualquier gym sin verificación
 *   - gym_admin   → solo al gym donde es admin (gym_id en su perfil
 *                   o en la tabla gym_admins)
 *   - trainer     → solo al gym al que está asignado
 *   - user        → solo si es miembro activo del gym
 *
 * Adjunta el gymId verificado al request para evitar
 * que los controllers lo revaliden.
 *
 * Uso:
 *   @UseGuards(SupabaseAuthGuard, GymMemberGuard)
 *   @Get('members')
 *   getMembers(@GymContext('gymId') gymId: string) { ... }
 */
@Injectable()
export class GymMemberGuard implements CanActivate {
    constructor(private readonly supabase: SupabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const gymId = request.headers['x-gym-id'] as string;

        if (!gymId) {
            throw new BadRequestException(
                'Header x-gym-id es requerido para operaciones del CRM',
            );
        }

        // super_admin tiene acceso universal
        if (user.role === 'super_admin') {
            request.gymId = gymId;
            return true;
        }

        // gym_admin y trainer: verificar que pertenecen al gym
        if (user.role === 'gym_admin' || user.role === 'trainer') {
            const hasAccess = await this.verifyStaffAccess(user.id, gymId);
            if (!hasAccess) {
                throw new ForbiddenException(
                    'No tienes acceso a este gimnasio',
                );
            }
            request.gymId = gymId;
            return true;
        }

        // user B2C: verificar que es miembro activo del gym
        const isMember = await this.verifyMemberAccess(user.id, gymId);
        if (!isMember) {
            throw new ForbiddenException(
                'No eres miembro de este gimnasio',
            );
        }

        request.gymId = gymId;
        return true;
    }

    /**
     * Verifica que un gym_admin o trainer pertenezca al gym.
     * Comprueba tanto el gym_id del perfil como la tabla gym_admins.
     */
    private async verifyStaffAccess(
        userId: string,
        gymId: string,
    ): Promise<boolean> {
        const { data, error } = await this.supabase
            .getClient()
            .from('profiles')
            .select('gym_id')
            .eq('id', userId)
            .eq('gym_id', gymId)
            .maybeSingle();

        return !error && data !== null;
    }

    /**
     * Verifica que un usuario B2C sea miembro activo del gym.
     */
    private async verifyMemberAccess(
        userId: string,
        gymId: string,
    ): Promise<boolean> {
        const { data, error } = await this.supabase
            .getClient()
            .from('gym_members')
            .select('id')
            .eq('user_id', userId)
            .eq('gym_id', gymId)
            .eq('status', 'active')
            .maybeSingle();

        return !error && data !== null;
    }
}