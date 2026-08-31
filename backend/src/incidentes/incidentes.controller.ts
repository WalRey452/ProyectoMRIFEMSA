import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, Put, UseInterceptors, UploadedFile, Req, UseGuards,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { IncidentesService } from './incidentes.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
import { FilterIncidenteDto } from './dto/filter-incidente.dto';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { CreateLeccionDto } from './dto/create-leccion.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, basename } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

/**
 * Tipos MIME permitidos para la subida de evidencias.
 * Esta lista es la fuente de verdad; el cliente no puede sobrescribirla.
 */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'text/plain',
]);

/**
 * Tamano maximo permitido por archivo de evidencia: 50 MB.
 */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Configuracion de almacenamiento en disco para Multer.
 * El nombre de archivo se genera de forma aleatoria para evitar colisiones
 * y para que no sea predecible por actores externos.
 */
const storageConfig = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Usar solo la extension del nombre original, descartando el nombre base
    // para evitar caracteres especiales o rutas maliciosas (path traversal).
    const safeExt = extname(basename(file.originalname)).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

/**
 * Filtro de tipo MIME que rechaza archivos no permitidos antes de guardarlos.
 * La validacion se realiza sobre el tipo MIME reportado por Multer, que a su
 * vez lo detecta a partir del Content-Type del multipart. Para mayor seguridad,
 * se recomienda agregar validacion de firma magica (magic bytes) en produccion.
 */
const mimeTypeFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new UnsupportedMediaTypeException(
        `Tipo de archivo no permitido: ${file.mimetype}. ` +
        `Tipos aceptados: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
      ),
      false,
    );
  }
};

/**
 * Controlador de incidentes de seguridad.
 * Gestiona el ciclo de vida completo de un incidente: creacion, seguimiento,
 * bitacora de acciones, subida de evidencias y lecciones aprendidas.
 *
 * Control de acceso por rol:
 *   ADMIN    -> Acceso total: ver, crear, editar, eliminar, gestionar evidencias.
 *   ANALISTA -> Ver, crear, editar. Sin permiso para eliminar.
 *   VIEWER   -> Solo lectura (endpoints GET).
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidentes')
export class IncidentesController {
  constructor(private readonly incidentesService: IncidentesService) {}

  /**
   * Crea un nuevo incidente de seguridad.
   * Requiere roles ADMIN o ANALISTA.
   */
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Post()
  create(@Body() createIncidenteDto: CreateIncidenteDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.incidentesService.create(createIncidenteDto, userId);
  }

  /**
   * Retorna la lista de incidentes con filtros y paginacion.
   * Accesible para todos los roles autenticados.
   */
  @Get()
  findAll(@Query() filters: FilterIncidenteDto) {
    return this.incidentesService.findAll(filters);
  }

  /**
   * Retorna estadisticas agregadas de incidentes por severidad, estado y categoria.
   * Accesible para todos los roles autenticados.
   */
  @Get('stats')
  getStats() {
    return this.incidentesService.getStats();
  }

  /**
   * Retorna los detalles completos de un incidente especifico, incluyendo
   * activos afectados, bitacora, evidencias y lecciones aprendidas.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentesService.findOne(id);
  }

  /**
   * Actualiza los campos de un incidente existente.
   * Requiere roles ADMIN o ANALISTA.
   */
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidenteDto: UpdateIncidenteDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.incidentesService.update(id, updateIncidenteDto, userId);
  }

  /**
   * Elimina permanentemente un incidente y todos sus registros asociados.
   * Requiere rol ADMIN exclusivamente.
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.incidentesService.delete(id, userId);
  }

  /**
   * Agrega una entrada a la bitacora del incidente.
   * Requiere roles ADMIN o ANALISTA.
   */
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Post(':id/bitacora')
  addBitacora(@Param('id') id: string, @Body() dto: CreateBitacoraDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.incidentesService.addBitacora(id, dto, userId);
  }

  /**
   * Sube un archivo de evidencia asociado al incidente.
   * Solo se aceptan los tipos MIME definidos en ALLOWED_MIME_TYPES con un
   * tamano maximo de 50 MB. El nombre del archivo se regenera aleatoriamente
   * para evitar path traversal y colisiones.
   * Requiere roles ADMIN o ANALISTA.
   */
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Post(':id/evidencia')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig,
      fileFilter: mimeTypeFilter,
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  addEvidencia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEvidenciaDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.incidentesService.addEvidencia(id, file, dto, userId);
  }

  /**
   * Elimina una evidencia especifica de un incidente.
   * Requiere rol ADMIN.
   */
  @Roles(Role.ADMIN)
  @Delete(':id/evidencia/:evidenciaId')
  removeEvidencia(@Param('evidenciaId') evidenciaId: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.incidentesService.deleteEvidencia(evidenciaId, userId);
  }

  /**
   * Crea o actualiza las lecciones aprendidas de un incidente.
   * Requiere roles ADMIN o ANALISTA.
   */
  @Roles(Role.ADMIN, Role.ANALISTA)
  @Put(':id/leccion')
  saveLeccion(@Param('id') id: string, @Body() dto: CreateLeccionDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.incidentesService.saveLeccion(id, dto, userId);
  }

  /**
   * Genera y retorna un reporte PDF del incidente.
   * Accesible para todos los roles autenticados.
   */
  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Req() req: any) {
    return { message: 'PDF Generation logic would go here' };
  }
}
