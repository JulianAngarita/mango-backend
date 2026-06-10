import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushNotification {
    token: string;           // FCM registration token del dispositivo
    title: string;
    body: string;
    data?: Record<string, string>;  // payload para deep linking en la app
    imageUrl?: string;
}

export interface PushResult {
    success: boolean;
    token: string;
    error?: string;
}

/**
 * PushService — envío de notificaciones push vía Firebase FCM v1 API.
 *
 * Usa la HTTP v1 API de FCM (más moderna que la legacy).
 * Autenticación con Service Account via OAuth2 (FIREBASE_PRIVATE_KEY).
 *
 * Las notificaciones individuales urgentes se envían directamente.
 * Las masivas (alertas de renovación del CRM, campañas) van por
 * notification.processor.ts de BullMQ para no bloquear el request.
 */
@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);
    private readonly projectId: string;
    private readonly fcmUrl: string;

    constructor(private readonly config: ConfigService) {
        this.projectId = this.config.get<string>('FIREBASE_PROJECT_ID') ?? '';
        this.fcmUrl = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
    }

    async send(notification: PushNotification): Promise<PushResult> {
        try {
            const accessToken = await this.getAccessToken();

            const message = {
                message: {
                    token: notification.token,
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        ...(notification.imageUrl ? { image: notification.imageUrl } : {}),
                    },
                    data: notification.data ?? {},
                    // Configuración específica por plataforma
                    android: {
                        priority: 'high',
                        notification: { sound: 'default', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                    },
                    apns: {
                        payload: { aps: { sound: 'default', badge: 1 } },
                    },
                },
            };

            const response = await fetch(this.fcmUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                const error = await response.text();
                this.logger.warn(`FCM error para token ${notification.token.slice(0, 8)}...: ${error}`);
                return { success: false, token: notification.token, error };
            }

            return { success: true, token: notification.token };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Error desconocido';
            this.logger.error(`FCM send error: ${error}`);
            return { success: false, token: notification.token, error };
        }
    }

    /**
     * Envío a múltiples dispositivos. Devuelve resultados individuales
     * para que el processor pueda reintentar los fallidos.
     */
    async sendMulticast(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<PushResult[]> {
        const results = await Promise.allSettled(
            tokens.map((token) => this.send({ token, title, body, data })),
        );

        return results.map((result, i) =>
            result.status === 'fulfilled'
                ? result.value
                : { success: false, token: tokens[i], error: String(result.reason) },
        );
    }

    /**
     * Obtiene el access token OAuth2 para la FCM v1 API.
     * En producción esto debería cachearse (expira en 1 hora).
     * TODO: cachear en Redis con CacheService para no pedir uno nuevo por request.
     */
    private async getAccessToken(): Promise<string> {
        const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n') ?? '';
        const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL') ?? '';

        // JWT firmado con la service account para obtener el token de FCM
        const jwt = this.buildJwt(clientEmail, privateKey);
        const tokenUrl = 'https://oauth2.googleapis.com/token';

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        const data = await response.json() as { access_token: string };
        return data.access_token;
    }

    private buildJwt(clientEmail: string, privateKey: string): string {
        // Implementación simplificada — en producción usar google-auth-library
        // para firmar el JWT correctamente con RS256.
        // Ver: https://firebase.google.com/docs/cloud-messaging/auth-server
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const now = Math.floor(Date.now() / 1000);
        const payload = Buffer.from(JSON.stringify({
            iss: clientEmail,
            sub: clientEmail,
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
        })).toString('base64url');

        // NOTA: la firma real requiere crypto.createSign('RSA-SHA256')
        // Esto es un placeholder — usar google-auth-library en producción
        return `${header}.${payload}.SIGNATURE_PLACEHOLDER`;
    }
}