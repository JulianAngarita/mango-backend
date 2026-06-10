import { WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../queue.module';

export type ReportType = 'members' | 'payments' | 'attendance' | 'retention' | 'prospects';
export type ReportFormat = 'pdf' | 'excel';

export interface ReportJobData {
    gymId: string;
    type: ReportType;
    format: ReportFormat;
    startDate: string;
    endDate: string;
    requestedBy: string;
    notifyEmail: string;
}

@Injectable()
export class ReportProcessor extends WorkerHost {
    private readonly logger = new Logger(ReportProcessor.name);

    constructor(
        @InjectQueue(QUEUES.REPORTS) private readonly queue: Queue,
    ) {
        super();
    }

    async process(job: Job<ReportJobData>): Promise<void> {
        const { gymId, type, format, startDate, endDate, notifyEmail } = job.data;

        this.logger.log(
            `Generando reporte ${type} (${format}) para gym ${gymId} — ${startDate} a ${endDate}`,
        );

        // TODO: implementar en fase 4 (CRM)
        // 1. Consultar datos del gym en Supabase (service_role)
        // 2. Generar PDF con pdfkit o Excel con exceljs
        // 3. Subir a Supabase Storage: reports/{gymId}/{type}-{date}.{format}
        // 4. Obtener URL pública con tiempo de expiración (1 semana)
        // 5. Encolar EmailProcessor con el link de descarga

        this.logger.log(`Reporte ${type} completado para gym ${gymId} — notificando a ${notifyEmail}`);
    }
}