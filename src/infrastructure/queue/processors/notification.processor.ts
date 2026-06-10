import { WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PushService } from '../../push/push.service';
import { QUEUES } from '../queue.module';

export interface NotificationJobData {
    type: 'single' | 'multicast';
    token?: string;
    tokens?: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

@Injectable()
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        @InjectQueue(QUEUES.NOTIFICATIONS) private readonly queue: Queue,
        private readonly pushService: PushService,
    ) {
        super();
    }

    async process(job: Job<NotificationJobData>): Promise<void> {
        const { type, title, body, data, imageUrl } = job.data;

        this.logger.debug(`Procesando job ${job.id} — tipo: ${type}`);

        if (type === 'single' && job.data.token) {
            const result = await this.pushService.send({
                token: job.data.token,
                title,
                body,
                data,
                imageUrl,
            });
            if (!result.success) throw new Error(`FCM error: ${result.error}`);
            return;
        }

        if (type === 'multicast' && job.data.tokens?.length) {
            const results = await this.pushService.sendMulticast(
                job.data.tokens, title, body, data,
            );
            const failed = results.filter((r) => !r.success);
            if (failed.length > 0) {
                this.logger.warn(`${failed.length} notificaciones fallaron en job ${job.id}`);
            }
        }
    }
}