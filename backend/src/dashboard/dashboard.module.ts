import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Incidente } from '../incidentes/entities/incidente.entity';
import { Evento } from '../eventos/entities/evento.entity';
import { BitacoraIncidente } from '../incidentes/entities/bitacora-incidente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incidente, Evento, BitacoraIncidente])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
