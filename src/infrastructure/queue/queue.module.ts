import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { NotificationProcessor } from './processors/notification.processor';
import { EmailProcessor } from './processors/email.processor';
import { ReportProcessor } from './processors/report.processor';
import { AiReportProcessor } from './processors/ai-report.processor';

export const QUEUES = {
    NOTIFICATIONS: 'notifications',
    EMAIL: 'email',
    REPORTS: 'reports',
    AI_REPORTS: 'ai-reports',
} as const;

/**
 * QueueModule — colas de jobs asíncronos con BullMQ v5 + Upstash Redis.
 *
 * En BullMQ v5 los processors se registran como providers estándar de NestJS.
 * El nombre de la cola se pasa en el WorkerHost del módulo BullMQ,
 * no como decorador en la clase del processor.
 */
@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    url: config.get<string>('redis.url'),
                    enableReadyCheck: false,
                    maxRetriesPerRequest: null,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 500 },
                },
            }),
        }),
        BullModule.registerQueue(
            { name: QUEUES.NOTIFICATIONS },
            { name: QUEUES.EMAIL },
            { name: QUEUES.REPORTS },
            { name: QUEUES.AI_REPORTS },
        ),
    ],
    providers: [
        NotificationProcessor,
        EmailProcessor,
        ReportProcessor,
        AiReportProcessor,
    ],
    exports: [BullModule],
})
export class QueueModule { }