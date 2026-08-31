import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PlaybooksService } from './playbooks.service';
import { PlaybooksController } from './playbooks.controller';
import { Playbook } from './entities/playbook.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playbook]),
    MulterModule.register({
      storage: memoryStorage(), // Guardar en memoria para luego persistir en BD
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos PDF'), false);
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  ],
  controllers: [PlaybooksController],
  providers: [PlaybooksService],
})
export class PlaybooksModule {}
