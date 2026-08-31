import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoAtaque } from '../enums/evento.enums';
import { Severidad } from '../../incidentes/enums/incidente.enums';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class FilterEventoDto extends PaginationDto {
  @IsEnum(Severidad)
  @IsOptional()
  severidad?: Severidad;

  @IsEnum(TipoAtaque)
  @IsOptional()
  tipo?: TipoAtaque;

  @IsString()
  @IsOptional()
  search?: string;
}
