import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidenteDto } from './create-incidente.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoIncidente } from '../enums/incidente.enums';

export class UpdateIncidenteDto extends PartialType(CreateIncidenteDto) {
  @IsEnum(EstadoIncidente)
  @IsOptional()
  estado?: EstadoIncidente;
}
