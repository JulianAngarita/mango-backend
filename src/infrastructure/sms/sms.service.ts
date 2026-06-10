import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
    to: string;   // formato E.164: +573001234567
    message: string;
}

export interface WhatsAppOptions {
    to: string;   // formato E.164
    message: string;
    mediaUrl?: string; // URL de imagen o documento adjunto
}

/**
 * SmsService — SMS y WhatsApp vía Twilio REST API.
 *
 * Usa la API de Twilio directamente con fetch (sin SDK)
 * para mantener las dependencias mínimas.
 *
 * WhatsApp requiere que el número esté registrado en Twilio
 * y que el destinatario haya iniciado conversación primero
 * (ventana de 24h) o usar un template aprobado por Meta.
 */
@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly accountSid: string;
    private readonly authToken: string;
    private readonly fromPhone: string;
    private readonly fromWhatsApp: string;
    private readonly baseUrl: string;

    constructor(private readonly config: ConfigService) {
        this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') ?? '';
        this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') ?? '';
        this.fromPhone = this.config.get<string>('TWILIO_PHONE_NUMBER') ?? '';
        this.fromWhatsApp = this.config.get<string>('TWILIO_WHATSAPP_NUMBER') ?? 'whatsapp:+14155238886';
        this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    }

    async sendSms(options: SmsOptions): Promise<void> {
        await this.twilioRequest({
            To: options.to,
            From: this.fromPhone,
            Body: options.message,
        });
        this.logger.log(`SMS enviado a ${options.to}`);
    }

    async sendWhatsApp(options: WhatsAppOptions): Promise<void> {
        await this.twilioRequest({
            To: `whatsapp:${options.to}`,
            From: this.fromWhatsApp,
            Body: options.message,
            ...(options.mediaUrl ? { MediaUrl: options.mediaUrl } : {}),
        });
        this.logger.log(`WhatsApp enviado a ${options.to}`);
    }

    private async twilioRequest(
        params: Record<string, string>,
    ): Promise<void> {
        const credentials = Buffer.from(
            `${this.accountSid}:${this.authToken}`,
        ).toString('base64');

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: new URLSearchParams(params),
        });

        if (!response.ok) {
            const error = await response.json() as { message: string };
            this.logger.error(`Twilio error: ${error.message}`);
            throw new Error(`Error al enviar mensaje: ${error.message}`);
        }
    }
}