import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../supabase/supabase.types';

export const ROLES_KEY = 'roles';

/**
 * @Roles() — restringe un endpoint a uno o más roles específicos.
 *
 * Debe usarse junto con RolesGuard, que lee esta metadata
 * y compara el rol del usuario autenticado.
 *
 * Roles disponibles (definidos en UserRole):
 *   - 'user'        → usuario B2C estándar
 *   - 'gym_admin'   → administrador de un gimnasio
 *   - 'trainer'     → entrenador asignado a un gimnasio
 *   - 'super_admin' → administrador global de la plataforma
 *
 * Uso:
 *   // Solo gym_admin puede crear membresías
 *   @Roles('gym_admin', 'super_admin')
 *   @Post('memberships')
 *   create() { ... }
 *
 *   // Solo super_admin puede ver todos los gyms
 *   @Roles('super_admin')
 *   @Get('gyms')
 *   findAll() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);