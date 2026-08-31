import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  // ─── Seguridad HTTP ──────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc:     ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc:  ["'none'"],
        frameSrc:   ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
      reportOnly: process.env.NODE_ENV !== 'production', // modo reporte en dev
    },
  }));

  // ─── Compresión de respuestas ────────────────────────────────
  app.use(compression());

  // ─── CORS ───────────────────────────────────────────────────
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:4200')
    .split(',')
    .map(o => o.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
    exposedHeaders: ['X-Total-Count', 'X-New-Access-Token'],
    credentials: true,
    maxAge: 3600,
  });

  // ─── Prefijo global de la API ────────────────────────────────
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // ─── Validación global ───────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Documentación Swagger ───────────────────────────────────
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Registro MRI API')
      .setDescription('API REST para el Registro de Monitoreo y Respuesta a Incidentes — FEMSA Salud CSIRT')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .addTag('auth', 'Autenticación y gestión de sesiones')
      .addTag('users', 'Gestión de usuarios y perfiles')
      .addTag('incidentes', 'Gestión de incidentes de seguridad')
      .addTag('eventos', 'Registro de eventos y alertas')
      .addTag('playbooks', 'Documentos y playbooks operativos')
      .addTag('escalamiento', 'Matriz de escalamiento')
      .addTag('dashboard', 'KPIs y métricas ejecutivas')
      .addTag('auditoria', 'Registro de auditoría del sistema')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║        REGISTRO MRI — FEMSA Salud CSIRT              ║
  ║  API REST corriendo en: http://localhost:${port}         ║
  ║  Documentación:  http://localhost:${port}/api/docs        ║
  ╚══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
