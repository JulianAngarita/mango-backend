import { ProfileRow } from '../../supabase/supabase.types';

/**
 * GymContext — contexto del gimnasio adjunto al request
 * después de que GymMemberGuard verifica el acceso.
 *
 * Disponible en controllers B2B via @GymContext() decorator.
 */
export interface GymContext {
    gymId: string;
}

/**
 * AuthenticatedRequest — extiende el Request de Express con
 * los campos que SupabaseAuthGuard y GymMemberGuard adjuntan.
 *
 * Útil para tipar el request en guards, interceptores y filtros
 * sin usar (request as any).
 */
export interface AuthenticatedRequest extends Request {
    user: ProfileRow;
    accessToken: string;
    gymId?: string;       // presente solo en endpoints B2B tras GymMemberGuard
}