import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — marca un endpoint como público (sin autenticación).
 *
 * Por defecto, el guard global SupabaseAuthGuard protege todos
 * los endpoints. Este decorador indica al guard que omita la
 * verificación del JWT para ese endpoint específico.
 *
 * Uso:
 *   @Public()
 *   @Get('health')
 *   healthCheck() { ... }
 *
 *   @Public()
 *   @Post('auth/webhook') // webhooks de Stripe no llevan JWT de usuario
 *   stripeWebhook() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);