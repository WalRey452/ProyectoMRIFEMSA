import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { EvidenciaEvento } from './entities/evidencia-evento.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { FilterEventoDto } from './dto/filter-evento.dto';
import { CreateEvidenciaDto } from '../incidentes/dto/create-evidencia.dto';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(EvidenciaEvento)
    private readonly evidenciaRepository: Repository<EvidenciaEvento>,
  ) {}

  async create(createEventoDto: CreateEventoDto, userId: string): Promise<Evento> {
    const evento = this.eventoRepository.create({
      ...createEventoDto,
      creadoPorId: userId,
    });
    return await this.eventoRepository.save(evento);
  }

  async findAll(filters: FilterEventoDto) {
    const { page, limit, severidad, tipo, search } = filters;
    const skip = (page - 1) * limit;

    const query = this.eventoRepository.createQueryBuilder('evento');

    if (severidad) query.andWhere('evento.severidad = :severidad', { severidad });
    if (tipo) query.andWhere('evento.tipo = :tipo', { tipo });
    if (search) {
      query.andWhere('(evento.titulo LIKE :search OR evento.codigoEvento LIKE :search)', { search: `%${search}%` });
    }

    query.skip(skip).take(limit).orderBy('evento.fechaDeteccion', 'DESC');
    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({ 
      where: { id },
      relations: ['evidencias']
    });
    if (!evento) throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    return evento;
  }

  async update(id: string, updateEventoDto: UpdateEventoDto, userId: string): Promise<Evento> {
    const evento = await this.findOne(id);
    this.eventoRepository.merge(evento, updateEventoDto);
    return await this.eventoRepository.save(evento);
  }

  async delete(id: string): Promise<void> {
    const evento = await this.findOne(id);
    await this.eventoRepository.remove(evento);
  }

  async getStats() {
    const [porSeveridad, porTipo] = await Promise.all([
      this.eventoRepository.createQueryBuilder('e').select('e.severidad', 'severidad').addSelect('COUNT(*)', 'count').groupBy('e.severidad').getRawMany(),
      this.eventoRepository.createQueryBuilder('e').select('e.tipo', 'tipo').addSelect('COUNT(*)', 'count').groupBy('e.tipo').getRawMany(),
    ]);
    return { porSeveridad, porTipo };
  }

  async addEvidencia(id: string, file: Express.Multer.File, dto: CreateEvidenciaDto, userId: string): Promise<EvidenciaEvento> {
    const evento = await this.findOne(id);
    
    // Save locally
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = `/uploads/${fileName}`;
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);

    const evidencia = this.evidenciaRepository.create({
      eventoId: evento.id,
      descripcion: dto.descripcion,
      archivoUrl: filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedById: userId,
    });

    return await this.evidenciaRepository.save(evidencia);
  }
}
