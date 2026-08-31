import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playbook } from './entities/playbook.entity';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';

@Injectable()
export class PlaybooksService {
  constructor(
    @InjectRepository(Playbook)
    private readonly playbookRepository: Repository<Playbook>,
  ) {}

  async create(file: Express.Multer.File, createPlaybookDto: CreatePlaybookDto, userId: string): Promise<Playbook> {
    const playbook = this.playbookRepository.create({
      ...createPlaybookDto,
      archivoData: file.buffer,        // Guardar el PDF en BD
      originalFilename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      archivoUrl: `/uploads/playbooks/${file.originalname}`, // Para referencia
      subidoPorId: userId,
    });
    return await this.playbookRepository.save(playbook);
  }

  async findAll(): Promise<Playbook[]> {
    // No incluir archivoData en el listado (columna con select:false)
    return await this.playbookRepository.find({ order: { fechaSubida: 'DESC' } });
  }

  async findOne(id: string): Promise<Playbook> {
    const playbook = await this.playbookRepository.findOne({ where: { id } });
    if (!playbook) throw new NotFoundException(`Playbook con ID ${id} no encontrado`);
    return playbook;
  }

  async findOneWithData(id: string): Promise<Playbook> {
    // Incluir el campo archivoData explícitamente para descarga
    const playbook = await this.playbookRepository
      .createQueryBuilder('p')
      .where('p.id = :id', { id })
      .addSelect('p.archivoData')
      .getOne();
    if (!playbook) throw new NotFoundException(`Playbook con ID ${id} no encontrado`);
    return playbook;
  }

  async update(id: string, updatePlaybookDto: UpdatePlaybookDto): Promise<Playbook> {
    const playbook = await this.findOne(id);
    this.playbookRepository.merge(playbook, updatePlaybookDto);
    return await this.playbookRepository.save(playbook);
  }

  async remove(id: string): Promise<void> {
    const playbook = await this.findOne(id);
    await this.playbookRepository.remove(playbook);
  }
}
