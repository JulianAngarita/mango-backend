import { WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUES } from '../queue.module';

export interface AiReportJobData {
  userId:    string;
  weekStart: string;
  weekEnd:   string;
}

@Injectable()
export class AiReportProcessor extends WorkerHost {
  private readonly logger       = new Logger(AiReportProcessor.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectQueue(QUEUES.AI_REPORTS) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {
    super();
    this.aiServiceUrl = this.config.get<string>('AI_SERVICE_URL') ?? '';
  }

  async process(job: Job<AiReportJobData>): Promise<void> {
    const { userId, weekStart, weekEnd } = job.data;

    this.logger.log(`Generando reporte IA para usuario ${userId} — semana ${weekStart}`);

    const response = await fetch(`${this.aiServiceUrl}/reports/weekly`, {
      method:  'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Service-Secret': this.config.get<string>('AI_SERVICE_SECRET') ?? '',
      },
      body: JSON.stringify({ userId, weekStart, weekEnd }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI service error ${response.status}: ${error}`);
    }

    const report = await response.json() as Record<string, unknown>;

    this.logger.log(`Reporte IA generado para ${userId} — semana ${weekStart}`);

    // TODO: guardar en Supabase tabla ai_reports
    // TODO: encolar NotificationProcessor para avisar al usuario

    void report; // TODO: guardar en Supabase + encolar push notification
  }
}