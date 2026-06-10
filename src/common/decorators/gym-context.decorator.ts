import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export interface GymContext {
  gymId: string;
}

/**
 * @GymContext() — extrae el contexto del gimnasio del header x-gym-id.
 *
 * Todos los endpoints B2B requieren este header para identificar
 * a qué gimnasio pertenece la operación. El GymMemberGuard valida
 * que el usuario autenticado tenga acceso a ese gym_id antes de
 * que llegue al controller.
 *
 * Uso en controllers B2B:
 *   @Get('members')
 *   @UseGuards(SupabaseAuthGuard, GymMemberGuard)
 *   getMembers(@GymContext() ctx: GymContext) {
 *     return this.service.findAll(ctx.gymId);
 *   }
 *
 *   // Solo el ID directamente:
 *   @Get('members')
 *   getMembers(@GymContext('gymId') gymId: string) { ... }
 */
export const GymContext = createParamDecorator(
  (field: keyof GymContext | undefined, ctx: ExecutionContext): GymContext | string => {
    const request = ctx.switchToHttp().getRequest();
    const gymId = request.headers['x-gym-id'] as string;

    if (!gymId) {
      throw new BadRequestException(
        'Header x-gym-id es requerido para operaciones del CRM',
      );
    }

    const context: GymContext = { gymId };
    return field ? context[field] : context;
  },
);