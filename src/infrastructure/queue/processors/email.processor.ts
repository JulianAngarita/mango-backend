import { WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailerService } from '../../mailer/mailer.service';
import { QUEUES } from '../queue.module';

export interface EmailJobData {
    type: 'single' | 'batch';
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    templateId?: string;
    variables?: Record<string, unknown>;
}

@Injectable()
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(
        @InjectQueue(QUEUES.EMAIL) private readonly queue: Queue,
        private readonly mailerService: MailerService,
    ) {
        super();
    }

    async process(job: Job<EmailJobData>): Promise<void> {
        const { to, subject, html, text } = job.data;

        this.logger.debug(`Procesando email job ${job.id} — a: ${Array.isArray(to) ? `${to.length} destinatarios` : to
            }`);

        await this.mailerService.send({ to, subject, html, text });

        this.logger.log(`Email enviado correctamente — job ${job.id}`);
    }
}