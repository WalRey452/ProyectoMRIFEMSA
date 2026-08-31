import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Incidente } from './entities/incidente.entity';
import { ActivoAfectado } from './entities/activo-afectado.entity';
import { BitacoraIncidente } from './entities/bitacora-incidente.entity';
import { EvidenciaIncidente } from './entities/evidencia-incidente.entity';
import { LeccionAprendida } from './entities/leccion-aprendida.entity';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { CreateLeccionDto } from './dto/create-leccion.dto';
import { FilterIncidenteDto } from './dto/filter-incidente.dto';
import { EstadoIncidente } from './enums/incidente.enums';

@Injectable()
export class IncidentesService {
  constructor(
    @InjectRepository(Incidente)
    private readonly incidenteRepository: Repository<Incidente>,
    @InjectRepository(ActivoAfectado)
    private readonly activoRepository: Repository<ActivoAfectado>,
    @InjectRepository(BitacoraIncidente)
    private readonly bitacoraRepository: Repository<BitacoraIncidente>,
    @InjectRepository(EvidenciaIncidente)
    private readonly evidenciaRepository: Repository<EvidenciaIncidente>,
    @InjectRepository(LeccionAprendida)
    private readonly leccionRepository: Repository<LeccionAprendida>,
  ) {}

  async create(createIncidenteDto: CreateIncidenteDto, userId: string): Promise<Incidente> {
    const { activos, bitacoraInicial, leccionesAprendidas, lineaTiempo, ...incidenteData } = createIncidenteDto;
    
    const incidente = this.incidenteRepository.create({
      ...incidenteData,
      creadoPorId: userId,
    });
    const savedIncidente = await this.incidenteRepository.save(incidente);

    if (activos && activos.length > 0) {
      const activosData = activos.filter((a: any) => a && a.ipHostname).map((a: any) => ({ ...a, incidenteId: savedIncidente.id }));
      const activosEntities = this.activoRepository.create(activosData);
      await this.activoRepository.save(activosEntities);
    }

    if (bitacoraInicial) {
      const bitacora = this.bitacoraRepository.create({
        incidenteId: savedIncidente.id,
        accionDetallada: bitacoraInicial,
        responsableId: userId,
        responsableNombre: incidenteData.reportadoPor || 'Usuario Creador',
      });
      await this.bitacoraRepository.save(bitacora);
    }

    if (lineaTiempo && lineaTiempo.length > 0) {
      for (const item of lineaTiempo) {
        if (item && (item.accion || item.accionDetallada)) {
          const b = this.bitacoraRepository.create({
            incidenteId: savedIncidente.id,
            accionDetallada: item.accion || item.accionDetallada,
            responsableId: userId,
            responsableNombre: item.responsable || 'Analista SOC',
            fechaHora: item.fechaHora ? new Date(item.fechaHora) : new Date(),
          });
          await this.bitacoraRepository.save(b);
        }
      }
    }

    if (leccionesAprendidas && (leccionesAprendidas.funcionoBien || leccionesAprendidas.fallo || leccionesAprendidas.mejoras || leccionesAprendidas.queFueBien)) {
      await this.saveLeccion(savedIncidente.id, leccionesAprendidas, userId);
    }

    return this.findOne(savedIncidente.id);
  }

  async findAll(filters: FilterIncidenteDto) {
    const { page, limit, severidad, estado, categoria, liderIncidenteId, fechaDesde, fechaHasta, search } = filters;
    const skip = (page - 1) * limit;

    const query = this.incidenteRepository.createQueryBuilder('incidente');

    if (severidad) query.andWhere('incidente.severidad = :severidad', { severidad });
    if (estado) query.andWhere('incidente.estado = :estado', { estado });
    if (categoria) query.andWhere('incidente.categoria = :categoria', { categoria });
    if (liderIncidenteId) query.andWhere('incidente.liderIncidenteId = :liderIncidenteId', { liderIncidenteId });
    if (fechaDesde && fechaHasta) {
      query.andWhere('incidente.fechaIdentificacion BETWEEN :fechaDesde AND :fechaHasta', { fechaDesde, fechaHasta });
    }
    if (search) {
      query.andWhere('(incidente.titulo LIKE :search OR incidente.codigoIncidente LIKE :search)', { search: `%${search}%` });
    }

    query.skip(skip).take(limit).orderBy('incidente.fechaIdentificacion', 'DESC');
    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Incidente> {
    const incidente = await this.incidenteRepository.findOne({
      where: { id },
      relations: ['activos', 'bitacoras', 'evidencias', 'leccionAprendida', 'creadoPor'],
    });
    if (!incidente) throw new NotFoundException(`Incidente con ID ${id} no encontrado`);
    return incidente;
  }

  async update(id: string, updateIncidenteDto: UpdateIncidenteDto, userId: string): Promise<Incidente> {
    const incidente = await this.findOne(id);
    const { activos, bitacoraInicial, leccionesAprendidas, lineaTiempo, ...incidenteData } = updateIncidenteDto as any;
    
    // Merge updates
    this.incidenteRepository.merge(incidente, incidenteData);
    
    // Hooks auto handle fechaCierre in BeforeUpdate
    const updated = await this.incidenteRepository.save(incidente);
    
    if (activos && Array.isArray(activos)) {
      await this.activoRepository.delete({ incidenteId: id });
      const activosData = activos.filter((a: any) => a && a.ipHostname).map((a: any) => ({ ...a, incidenteId: id }));
      const activosEntities = this.activoRepository.create(activosData);
      await this.activoRepository.save(activosEntities);
    }

    if (lineaTiempo && Array.isArray(lineaTiempo) && lineaTiempo.length > 0) {
      for (const item of lineaTiempo) {
        if (item && (item.accion || item.accionDetallada)) {
          const exists = incidente.bitacoras?.some(b => b.accionDetallada === (item.accion || item.accionDetallada));
          if (!exists) {
            const b = this.bitacoraRepository.create({
              incidenteId: id,
              accionDetallada: item.accion || item.accionDetallada,
              responsableId: userId,
              responsableNombre: item.responsable || 'Analista SOC',
              fechaHora: item.fechaHora ? new Date(item.fechaHora) : new Date(),
            });
            await this.bitacoraRepository.save(b);
          }
        }
      }
    }

    if (leccionesAprendidas && (leccionesAprendidas.funcionoBien || leccionesAprendidas.fallo || leccionesAprendidas.mejoras || leccionesAprendidas.queFueBien)) {
      await this.saveLeccion(id, leccionesAprendidas, userId);
    }

    // Add bitacora entry for update
    await this.addBitacora(id, { incidenteId: id, accionDetallada: `Incidente actualizado. Estado: ${updated.estado}` }, userId);
    
    return this.findOne(id);
  }

  async addBitacora(incidenteId: string, dto: CreateBitacoraDto, userId: string): Promise<BitacoraIncidente> {
    const bitacora = this.bitacoraRepository.create({
      ...dto,
      incidenteId,
      responsableId: userId,
      responsableNombre: 'Usuario Acción'
    });
    return await this.bitacoraRepository.save(bitacora);
  }

  async addEvidencia(incidenteId: string, file: Express.Multer.File, dto: CreateEvidenciaDto, userId: string): Promise<EvidenciaIncidente> {
    const evidencia = this.evidenciaRepository.create({
      ...dto,
      incidenteId,
      archivoUrl: `/uploads/${file.filename}`, // Example path
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedById: userId,
    });
    return await this.evidenciaRepository.save(evidencia);
  }

  async deleteEvidencia(evidenciaId: string, userId: string): Promise<void> {
    const evidencia = await this.evidenciaRepository.findOne({ where: { id: evidenciaId } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    // Delete file logic goes here
    await this.evidenciaRepository.remove(evidencia);
  }

  async saveLeccion(incidenteId: string, dto: CreateLeccionDto, userId: string): Promise<LeccionAprendida> {
    let leccion = await this.leccionRepository.findOne({ where: { incidenteId } });
    if (leccion) {
      this.leccionRepository.merge(leccion, dto);
    } else {
      leccion = this.leccionRepository.create({ ...dto, incidenteId, creadoPorId: userId });
    }
    return await this.leccionRepository.save(leccion);
  }

  async delete(id: string, userId: string): Promise<void> {
    const incidente = await this.findOne(id);
    await this.incidenteRepository.remove(incidente);
  }

  async getStats() {
    const [porSeveridad, porEstado, porCategoria] = await Promise.all([
      this.incidenteRepository.createQueryBuilder('i').select('i.severidad', 'severidad').addSelect('COUNT(*)', 'count').groupBy('i.severidad').getRawMany(),
      this.incidenteRepository.createQueryBuilder('i').select('i.estado', 'estado').addSelect('COUNT(*)', 'count').groupBy('i.estado').getRawMany(),
      this.incidenteRepository.createQueryBuilder('i').select('i.categoria', 'categoria').addSelect('COUNT(*)', 'count').groupBy('i.categoria').getRawMany(),
    ]);
    const total = porEstado.reduce((acc, curr) => acc + parseInt(curr.count || '0', 10), 0);
    const criticosObj = porSeveridad.find(s => s.severidad === 'CRITICA');
    const criticos = criticosObj ? parseInt(criticosObj.count || '0', 10) : 0;
    const enAtencion = porEstado.filter(e => e.estado !== 'CERRADO').reduce((acc, curr) => acc + parseInt(curr.count || '0', 10), 0);
    const cerradosMesObj = porEstado.find(e => e.estado === 'CERRADO');
    const cerradosMes = cerradosMesObj ? parseInt(cerradosMesObj.count || '0', 10) : 0;
    return { total, criticos, enAtencion, cerradosMes, porSeveridad, porEstado, porCategoria };
  }
}
