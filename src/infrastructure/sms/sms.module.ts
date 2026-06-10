import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';

/**
 * SmsModule — SMS y WhatsApp vía Twilio.
 *
 * Casos de uso principales:
 *   - Verificación de teléfono en el onboarding
 *   - Recordatorios de renovación de membresía (B2B)
 *   - Alertas de pago fallido
 *   - Mensajes de reactivación de prospectos
 *   - WhatsApp automático desde el CRM
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule { }