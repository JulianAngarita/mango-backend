import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Delega el logging a Pino desde el inicio,
    // incluyendo los logs del bootstrap
    bufferLogs: true,
  });

  // ── Logger ──────────────────────────────────────────────────────────────────
  // Reemplaza el logger por defecto de NestJS por Pino (JSON en prod, pretty en dev)
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');
  const isDev = nodeEnv === 'development';

  // ── Seguridad ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: config.get<string>('app.corsOrigins', '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gym-id'],
    credentials: true,
  });

  // ── Prefijo global y versionado ──────────────────────────────────────────────
  // Todas las rutas quedan bajo /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Validación global ────────────────────────────────────────────────────────
  // Activa class-validator en todos los DTOs automáticamente.
  // whitelist: descarta propiedades que no estén en el DTO (evita contaminación).
  // forbidNonWhitelisted: devuelve 400 si llegan propiedades extra (estricto en prod).
  // transform: convierte los tipos de query params (string → number, etc.).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: !isDev,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Filtros e interceptores globales ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // ── Swagger (solo en desarrollo) ─────────────────────────────────────────────
  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mango API')
      .setDescription(
        'API de la plataforma Mango — Bienestar, fitness social y CRM para gimnasios.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT generado por Supabase Auth',
        },
        'supabase-jwt',
      )
      .addTag('auth', 'Autenticación y sesiones')
      .addTag('users', 'Perfil y configuración de usuario')
      .addTag('habits', 'Registro y seguimiento de hábitos')
      .addTag('tracking', 'Agua, sueño, nutrición y peso')
      .addTag('workouts', 'Entrenamientos y actividad física')
      .addTag('feed', 'Publicaciones y feed social')
      .addTag('gamification', 'XP, niveles, rachas e insignias')
      .addTag('gyms', 'Gestión de gimnasios (B2B)')
      .addTag('memberships', 'Planes y membresías')
      .addTag('payments', 'Cobros y facturación')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`Swagger disponible en http://localhost:${port}/api/docs`);
  }

  // ── Health check ─────────────────────────────────────────────────────────────
  // Render llama a /health para verificar que el servicio está vivo
  // El endpoint lo expone TerminusModule en AppModule

  await app.listen(port);
  console.log(`Mango API corriendo en http://localhost:${port}/api/v1`);
}

bootstrap();


# ── App ────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# ── Supabase ───────────────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # solo en backend, nunca en cliente

# ── Redis (Upstash — serverless, compatible con Render) ────
UPSTASH_REDIS_URL=rediss://...
UPSTASH_REDIS_TOKEN=...

# ── Pagos ──────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=...

# ── Comunicaciones ─────────────────────────────────────────
SENDGRID_API_KEY=SG....
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
WHATSAPP_API_KEY=...

# ── Notificaciones push ─────────────────────────────────────
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# ── Microservicio IA (Render) ───────────────────────────────
AI_SERVICE_URL=https://mango-ai.onrender.com
AI_SERVICE_SECRET=...
