import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EscalamientoService } from './escalamiento.service';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';

@Controller('escalamiento')
export class EscalamientoController {
  constructor(private readonly escalamientoService: EscalamientoService) {}

  @Post()
  create(@Body() createContactoDto: CreateContactoDto) {
    return this.escalamientoService.create(createContactoDto);
  }

  @Get()
  findAll() {
    return this.escalamientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.escalamientoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactoDto: UpdateContactoDto) {
    return this.escalamientoService.update(id, updateContactoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.escalamientoService.remove(id);
  }
}
