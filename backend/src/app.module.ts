import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as neon from '@neondatabase/serverless';
import * as ws from 'ws';

/**
 * Configuracion de la conexion WebSocket requerida por Neon.tech.
 * El driver serverless de Neon utiliza WebSockets para la comunicacion con PostgreSQL.
 */
neon.neonConfig.webSocketConstructor = ws;

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncidentesModule } from './incidentes/incidentes.module';
import { EventosModule } from './eventos/eventos.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { EscalamientoModule } from './escalamiento/escalamiento.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { PdfModule } from './pdf/pdf.module';
import { EmailModule } from './email/email.module';

/**
 * Modulo raiz de la aplicacion.
 * Configura e integra todos los modulos funcionales, la base de datos PostgreSQL (Neon.tech),
 * el rate limiting global, las tareas programadas y el servicio de archivos estaticos.
 *
 * Nota sobre SSL corporativo (FEMSA): El proxy corporativo intercepta certificados TLS.
 * La variable de entorno NODE_TLS_REJECT_UNAUTHORIZED se controla exclusivamente desde
 * el archivo .env y nunca se hardcodea en este codigo fuente, permitiendo que en entornos
 * de produccion sin proxy la verificacion SSL este habilitada.
 */
@Module({
  imports: [
    // ─── Configuracion global desde archivo .env ──────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Limitacion de peticiones (rate limiting) ──────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ─── Tareas programadas (cron jobs) ───────────────────────────
    ScheduleModule.forRoot(),

    // ─── Conexion a PostgreSQL via Neon.tech ───────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'mri_user'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE', 'registro_mri'),
        schema: config.get<string>('DB_SCHEMA', 'public'),
        // Neon.tech requiere SSL. rejectUnauthorized se controla desde .env:
        // DB_SSL_REJECT_UNAUTHORIZED=false en red FEMSA con proxy corporativo.
        // DB_SSL_REJECT_UNAUTHORIZED=true en producción sin proxy.
        ssl: { rejectUnauthorized: config.get<string>('DB_SSL_REJECT_UNAUTHORIZED') !== 'false' },
        driver: neon,
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        // synchronize: SIEMPRE false. Usar migraciones controladas.
        // Un error en NODE_ENV podría ejecutar synchronize en producción
        // y eliminar columnas o tablas.
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true,
        // Pool de conexiones con timeout para evitar agotamiento de recursos.
        extra: {
          max: 10,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),

    // ─── Servicio de archivos estaticos (uploads) ─────────────────
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: join(process.cwd(), config.get<string>('UPLOAD_DIR', './uploads')),
          serveRoot: '/uploads',
          serveStaticOptions: {
            index: false,
            fallthrough: false,
          },
        },
      ],
    }),

    // ─── Modulos de dominio de la aplicacion ──────────────────────
    AuthModule,
    UsersModule,
    IncidentesModule,
    EventosModule,
    PlaybooksModule,
    EscalamientoModule,
    DashboardModule,
    AuditoriaModule,
    PdfModule,
    EmailModule,
  ],
})
export class AppModule {}
