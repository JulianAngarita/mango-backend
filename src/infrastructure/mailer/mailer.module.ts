import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';

/**
 * MailerModule — wrapper sobre SendGrid para emails transaccionales.
 *
 * Los emails de campaña masiva del CRM (renovaciones, reactivaciones,
 * cumpleaños) se procesan vía BullMQ en email.processor.ts para no
 * bloquear el request y tener reintentos automáticos.
 *
 * Los emails transaccionales urgentes (bienvenida, confirmación de pago)
 * se envían directamente desde MailerService.
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [MailerService],
    exports: [MailerService],
})
export class MailerModule { }