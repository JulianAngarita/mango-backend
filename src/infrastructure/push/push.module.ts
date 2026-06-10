import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushService } from './push.service';

/**
 * PushModule — notificaciones push vía Firebase FCM.
 *
 * Las notificaciones en tiempo real del feed usan Supabase Realtime
 * directamente en el cliente. Este módulo cubre los push nativos
 * de iOS y Android que aparecen aunque la app esté cerrada:
 *   - Nuevo seguidor
 *   - Reacción a una publicación
 *   - Reto comunitario iniciado
 *   - Alerta de racha en peligro
 *   - Renovación de membresía próxima (B2B)
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [PushService],
    exports: [PushService],
})
export class PushModule { }