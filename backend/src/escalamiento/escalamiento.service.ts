import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactoEscalamiento } from './entities/contacto-escalamiento.entity';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';

@Injectable()
export class EscalamientoService {
  constructor(
    @InjectRepository(ContactoEscalamiento)
    private readonly contactoRepository: Repository<ContactoEscalamiento>,
  ) {}

  async create(createContactoDto: CreateContactoDto): Promise<ContactoEscalamiento> {
    const contacto = this.contactoRepository.create(createContactoDto);
    return await this.contactoRepository.save(contacto);
  }

  async findAll(): Promise<ContactoEscalamiento[]> {
    return await this.contactoRepository.find({ order: { nivel: 'ASC' } });
  }

  async findOne(id: string): Promise<ContactoEscalamiento> {
    const contacto = await this.contactoRepository.findOne({ where: { id } });
    if (!contacto) throw new NotFoundException(`Contacto con ID ${id} no encontrado`);
    return contacto;
  }

  async update(id: string, updateContactoDto: UpdateContactoDto): Promise<ContactoEscalamiento> {
    const contacto = await this.findOne(id);
    this.contactoRepository.merge(contacto, updateContactoDto);
    return await this.contactoRepository.save(contacto);
  }

  async remove(id: string): Promise<void> {
    const contacto = await this.findOne(id);
    await this.contactoRepository.remove(contacto);
  }
}
