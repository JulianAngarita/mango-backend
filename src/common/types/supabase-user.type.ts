import { User } from '@supabase/supabase-js';
import { ProfileRow } from '../../supabase/supabase.types';

/**
 * SupabaseAuthUser — usuario tal como lo devuelve auth.getUser().
 * Contiene los datos de autenticación pero NO el perfil extendido
 * (xp, level, role, gym_id, etc.).
 *
 * Solo se usa en SupabaseAuthGuard durante la verificación del token.
 * El resto del sistema trabaja con ProfileRow.
 */
export type SupabaseAuthUser = User;

/**
 * AuthUser — perfil completo del usuario autenticado.
 * Es el tipo que se adjunta a request.user y que @CurrentUser() devuelve.
 *
 * Combina los datos de auth.users (gestionado por Supabase)
 * con los de la tabla profiles (gestionado por la app).
 */
export type AuthUser = ProfileRow;

/**
 * JwtPayload — campos decodificados del JWT de Supabase Auth.
 *
 * Supabase incluye el rol en el claim 'role' del token.
 * Se usa para validación rápida sin hacer query a la BD.
 */
export interface JwtPayload {
    sub: string;           // user UUID (= profiles.id)
    email: string;
    role: string;           // rol de Supabase Auth (authenticated)
    app_metadata: {
        provider: string;           // email | google | apple
    };
    user_metadata: Record<string, unknown>;
    iat: number;
    exp: number;
}