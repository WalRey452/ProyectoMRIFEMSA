import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { IncidentesService } from './incidentes.service';
import { IncidentesController } from './incidentes.controller';
import { Incidente } from './entities/incidente.entity';
import { ActivoAfectado } from './entities/activo-afectado.entity';
import { BitacoraIncidente } from './entities/bitacora-incidente.entity';
import { EvidenciaIncidente } from './entities/evidencia-incidente.entity';
import { LeccionAprendida } from './entities/leccion-aprendida.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incidente,
      ActivoAfectado,
      BitacoraIncidente,
      EvidenciaIncidente,
      LeccionAprendida
    ]),
    MulterModule.register({
      dest: './uploads',
    })
  ],
  controllers: [IncidentesController],
  providers: [IncidentesService],
  exports: [IncidentesService]
})
export class IncidentesModule {}
