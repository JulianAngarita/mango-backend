/**
 * users.routes.ts — mapa de rutas del módulo Users.
 *
 * B2C (UsersController):
 *   GET    /api/v1/users/me             — perfil propio
 *   PATCH  /api/v1/users/me             — actualizar perfil
 *   DELETE /api/v1/users/me             — eliminar cuenta
 *   GET    /api/v1/users/:id/public     — perfil público
 *
 * B2B (UsersAdminController):
 *   POST   /api/v1/admin/users          — crear usuario (CRM)
 *   PATCH  /api/v1/admin/users/:id      — editar usuario
 *   GET    /api/v1/admin/users/gym/:id  — listar por gimnasio
 *   GET    /api/v1/admin/users/:id      — detalle de usuario
 */
export const USER_ROUTES = {
  // B2C
  ME: 'users/me',
  PUBLIC_PROFILE: 'users/:id/public',

  // B2B
  ADMIN_CREATE: 'admin/users',
  ADMIN_UPDATE: 'admin/users/:id',
  ADMIN_LIST_GYM: 'admin/users/gym/:gymId',
  ADMIN_DETAIL: 'admin/users/:id',
} as const;