import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

/**
 * MailerService — envío de emails vía SendGrid.
 *
 * Usa fetch nativo (Node 18+) para evitar una dependencia extra.
 * SendGrid se configura con SENDGRID_API_KEY en las variables de entorno.
 *
 * Para emails masivos del CRM usar el email.processor.ts de BullMQ,
 * que añade reintentos automáticos y no bloquea el request principal.
 */
@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);
    private readonly apiKey: string;
    private readonly fromEmail: string;
    private readonly fromName: string;
    private readonly apiUrl = 'https://api.sendgrid.com/v3/mail/send';

    constructor(private readonly config: ConfigService) {
        this.apiKey = this.config.get<string>('SENDGRID_API_KEY') ?? '';
        this.fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL') ?? 'no-reply@mango.app';
        this.fromName = this.config.get<string>('SENDGRID_FROM_NAME') ?? 'Mango';
    }

    async send(options: MailOptions): Promise<void> {
        const recipients = Array.isArray(options.to)
            ? options.to.map((email) => ({ email }))
            : [{ email: options.to }];

        const payload = {
            personalizations: [{ to: recipients, subject: options.subject }],
            from: { email: options.from ?? this.fromEmail, name: this.fromName },
            content: [
                { type: 'text/html', value: options.html },
                ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
            ],
            ...(options.replyTo ? { reply_to: { email: options.replyTo } } : {}),
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.text();
            this.logger.error(`SendGrid error ${response.status}: ${body}`);
            throw new Error(`Error al enviar email: ${response.statusText}`);
        }

        this.logger.log(`Email enviado a ${options.to} — "${options.subject}"`);
    }

    /**
     * Envío en lote. SendGrid acepta hasta 1000 destinatarios por request.
     * Para listas más grandes usar email.processor.ts con BullMQ.
     */
    async sendBatch(
        recipients: string[],
        subject: string,
        html: string,
    ): Promise<void> {
        const BATCH_SIZE = 1000;
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            await this.send({
                to: recipients.slice(i, i + BATCH_SIZE),
                subject,
                html,
            });
        }
    }
}