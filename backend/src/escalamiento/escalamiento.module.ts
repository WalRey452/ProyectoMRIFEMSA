import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscalamientoService } from './escalamiento.service';
import { EscalamientoController } from './escalamiento.controller';
import { ContactoEscalamiento } from './entities/contacto-escalamiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactoEscalamiento])],
  controllers: [EscalamientoController],
  providers: [EscalamientoService],
})
export class EscalamientoModule {}
