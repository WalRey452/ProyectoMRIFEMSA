import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseInterceptors, UploadedFile, Req, Res, StreamableFile
} from '@nestjs/common';
import { PlaybooksService } from './playbooks.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@Controller('playbooks')
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPlaybookDto: CreatePlaybookDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.playbooksService.create(file, createPlaybookDto, userId);
  }

  @Get()
  findAll() {
    return this.playbooksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playbooksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaybookDto: UpdatePlaybookDto) {
    return this.playbooksService.update(id, updatePlaybookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playbooksService.remove(id);
  }

  /**
   * Ver el PDF en el navegador (inline)
   * GET /api/v1/playbooks/:id/view
   */
  @Get(':id/view')
  async viewPdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const playbook = await this.playbooksService.findOneWithData(id);

    if (!playbook.archivoData) {
      res.status(404).json({ message: 'Datos del archivo no encontrados en la base de datos' });
      return;
    }

    const buffer = Buffer.isBuffer(playbook.archivoData)
      ? playbook.archivoData
      : Buffer.from(playbook.archivoData);

    const safeFilename = encodeURIComponent(playbook.nombre || 'playbook').replace(/'/g, '%27');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${safeFilename}.pdf`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache',
    });

    return new StreamableFile(buffer);
  }

  /**
   * Descargar el PDF como archivo
   * GET /api/v1/playbooks/:id/download
   */
  @Get(':id/download')
  async downloadPdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const playbook = await this.playbooksService.findOneWithData(id);

    if (!playbook.archivoData) {
      res.status(404).json({ message: 'Datos del archivo no encontrados en la base de datos' });
      return;
    }

    const buffer = Buffer.isBuffer(playbook.archivoData)
      ? playbook.archivoData
      : Buffer.from(playbook.archivoData);

    const safeFilename = encodeURIComponent(playbook.nombre || 'playbook').replace(/'/g, '%27');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}.pdf`,
      'Content-Length': buffer.length.toString(),
    });

    return new StreamableFile(buffer);
  }
}
