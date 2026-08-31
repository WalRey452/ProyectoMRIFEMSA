import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, Req, UseInterceptors, UploadedFile, UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { FilterEventoDto } from './dto/filter-evento.dto';
import { CreateEvidenciaDto } from '../incidentes/dto/create-evidencia.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

const storageConfig = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  }
});

// ─── Permisos por rol ────────────────────────────────────────────
// ADMIN    → Acceso total: ver, crear, editar, eliminar
// ANALISTA → Ver, crear, editar (NO eliminar)
// VIEWER   → Solo lectura (GET únicamente)

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  // ─── CREAR: ADMIN + ANALISTA ─────────────────────────────────
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Post()
  create(@Body() createEventoDto: CreateEventoDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.eventosService.create(createEventoDto, userId);
  }

  // ─── LECTURA: Todos los roles autenticados ────────────────────
  @Get()
  findAll(@Query() filters: FilterEventoDto) {
    return this.eventosService.findAll(filters);
  }

  @Get('stats')
  getStats() {
    return this.eventosService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventosService.findOne(id);
  }

  // ─── EDITAR: ADMIN + ANALISTA ────────────────────────────────
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventoDto: UpdateEventoDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.eventosService.update(id, updateEventoDto, userId);
  }

  // ─── ELIMINAR: Solo ADMIN ────────────────────────────────────
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventosService.delete(id);
  }

  // ─── PDF: Todos pueden descargar ─────────────────────────────
  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Req() req: any) {
    return { message: 'PDF Generation logic would go here' };
  }

  // ─── EVIDENCIA: ADMIN + ANALISTA ────────────────────────────
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Post(':id/evidencia')
  @UseInterceptors(FileInterceptor('file', { storage: storageConfig }))
  addEvidencia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEvidenciaDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return this.eventosService.addEvidencia(id, file, dto, userId);
  }
}

