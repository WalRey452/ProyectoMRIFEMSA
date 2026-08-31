import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';
import { Evento } from './entities/evento.entity';
import { EvidenciaEvento } from './entities/evidencia-evento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento, EvidenciaEvento]),
    MulterModule.register({
      dest: './uploads',
    })
  ],
  controllers: [EventosController],
  providers: [EventosService],
  exports: [EventosService]
})
export class EventosModule {}
