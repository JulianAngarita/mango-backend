import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Mango API')
        .setDescription(
            `## Mango — Plataforma de Bienestar, Fitness Social y CRM para Gimnasios

### Autenticación
Todas las rutas protegidas requieren un JWT generado por **Supabase Auth**.

Incluirlo en el header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Contexto de gimnasio (B2B)
Los endpoints del CRM requieren además el header:
\`\`\`
x-gym-id: <uuid-del-gimnasio>
\`\`\`

### Versión
Todos los endpoints tienen el prefijo \`/api/v1/\`
      `,
        )
        .setVersion('1.0')
        .setContact('Mango Team', '', 'dev@mango.app')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT generado por Supabase Auth',
                name: 'Authorization',
                in: 'header',
            },
            'supabase-jwt',
        )
        .addApiKey(
            {
                type: 'apiKey',
                name: 'x-gym-id',
                in: 'header',
                description: 'UUID del gimnasio (requerido en endpoints B2B)',
            },
            'gym-context',
        )
        // ── B2C ────────────────────────────────────────────────
        .addTag('auth', 'Autenticación y sincronización de perfil')
        .addTag('users', 'Perfil, avatar y configuración de usuario')
        .addTag('onboarding', 'Flujo de bienvenida y configuración inicial')
        .addTag('goals', 'Objetivos personales de salud y fitness')
        .addTag('habits', 'Registro y seguimiento de hábitos diarios')
        .addTag('tracking', 'Agua, sueño, nutrición y peso corporal')
        .addTag('workouts', 'Entrenamientos y actividad física')
        .addTag('progress', 'Métricas, estadísticas e historial')
        .addTag('feed', 'Publicaciones y feed social')
        .addTag('social', 'Seguidores, comentarios y reacciones')
        .addTag('gamification', 'XP, niveles, rachas, insignias y retos')
        .addTag('challenges', 'Retos personales y comunitarios')
        .addTag('notifications', 'Preferencias y historial de notificaciones')
        .addTag('search', 'Búsqueda de usuarios y contenido')
        .addTag('ai', 'Recomendaciones e informes generados por IA')
        .addTag('wearables', 'Sincronización con Apple Health, Google Fit y Garmin')
        .addTag('subscriptions', 'Planes Premium y gestión de suscripción B2C')
        // ── B2B ────────────────────────────────────────────────
        .addTag('gyms', 'Registro y configuración de gimnasios')
        .addTag('gym-members', 'Relación gimnasio-usuario y asignaciones')
        .addTag('memberships', 'Planes, membresías y renovaciones')
        .addTag('prospects', 'Pipeline de ventas y seguimiento de prospectos')
        .addTag('attendance', 'Control de asistencia y acceso por QR')
        .addTag('payments', 'Cobros, facturación y pagos recurrentes')
        .addTag('trainers', 'Gestión de entrenadores y alumnos asignados')
        .addTag('communications', 'Mensajes automáticos por email, SMS y WhatsApp')
        .addTag('segments', 'Segmentación de clientes por comportamiento')
        .addTag('crm-analytics', 'KPIs de retención, churn e ingresos')
        .addTag('reports', 'Reportes operativos y exportaciones')
        // ── Sistema ────────────────────────────────────────────
        .addTag('health', 'Estado del servicio')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,   // conserva el token entre recargas
            filter: true,                 // buscador de endpoints
            displayRequestDuration: true, // muestra el tiempo de respuesta
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
        },
        customSiteTitle: 'Mango API Docs',
    });
}