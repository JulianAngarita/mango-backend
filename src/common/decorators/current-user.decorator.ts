import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProfileRow } from '../../supabase/supabase.types';

/**
 * @CurrentUser() — extrae el usuario autenticado del request.
 *
 * El guard SupabaseAuthGuard verifica el JWT y adjunta el usuario
 * al request antes de que llegue al controller. Este decorador
 * simplemente lo extrae de forma limpia.
 *
 * Uso en controllers:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: ProfileRow) { ... }
 *
 *   // Solo un campo específico:
 *   @Get('me')
 *   getMe(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof ProfileRow | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ProfileRow = request.user;

    return field ? user?.[field] : user;
  },
);