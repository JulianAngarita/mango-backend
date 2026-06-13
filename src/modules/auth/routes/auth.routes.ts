/**
 * auth.routes.ts — mapa de rutas del módulo Auth.
 *
 * Públicas (sin token):
 *   POST /api/v1/auth/register           — registro B2C
 *   POST /api/v1/auth/crm/register       — registro B2B (gym_admin/trainer)
 *   POST /api/v1/auth/login              — login email/password
 *   POST /api/v1/auth/oauth/callback     — intercambio tokens OAuth
 *   POST /api/v1/auth/refresh            — renovar tokens
 *   POST /api/v1/auth/forgot-password    — solicitar reset
 *
 * Protegidas (requieren Bearer token):
 *   POST /api/v1/auth/logout             — cerrar sesión
 *   POST /api/v1/auth/reset-password     — cambiar contraseña con token
 *   POST /api/v1/auth/change-password    — cambiar contraseña autenticado
 *   POST /api/v1/auth/change-email       — cambiar email autenticado
 *   GET  /api/v1/auth/me                 — perfil autenticado actual
 *   POST /api/v1/auth/sync-profile       — sincronizar perfil tras OAuth
 */
export const AUTH_ROUTES = {
    // Públicas
    REGISTER: 'auth/register',
    CRM_REGISTER: 'auth/crm/register',
    LOGIN: 'auth/login',
    OAUTH_CALLBACK: 'auth/oauth/callback',
    REFRESH: 'auth/refresh',
    FORGOT_PASSWORD: 'auth/forgot-password',

    // Protegidas
    LOGOUT: 'auth/logout',
    RESET_PASSWORD: 'auth/reset-password',
    CHANGE_PASSWORD: 'auth/change-password',
    CHANGE_EMAIL: 'auth/change-email',
    ME: 'auth/me',
    SYNC_PROFILE: 'auth/sync-profile',
} as const;