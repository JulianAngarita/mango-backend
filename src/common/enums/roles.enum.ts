/**
 * Roles de usuario en la plataforma Mango.
 * Deben coincidir con el enum user_role definido en PostgreSQL.
 *
 * Flujo de asignación:
 *   - 'user'        → asignado por defecto al registrarse
 *   - 'trainer'     → asignado por un gym_admin
 *   - 'gym_admin'   → asignado al crear o ser invitado a un gimnasio
 *   - 'super_admin' → asignado manualmente en la BD
 */
export enum Role {
    USER = 'user',
    TRAINER = 'trainer',
    GYM_ADMIN = 'gym_admin',
    SUPER_ADMIN = 'super_admin',
}