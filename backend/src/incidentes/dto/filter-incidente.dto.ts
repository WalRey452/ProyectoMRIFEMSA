import { IsEnum, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaIncidente, EstadoIncidente, Severidad } from '../enums/incidente.enums';

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

export class FilterIncidenteDto extends PaginationDto {
  @IsEnum(Severidad)
  @IsOptional()
  severidad?: Severidad;

  @IsEnum(EstadoIncidente)
  @IsOptional()
  estado?: EstadoIncidente;

  @IsEnum(CategoriaIncidente)
  @IsOptional()
  categoria?: CategoriaIncidente;

  @IsUUID()
  @IsOptional()
  liderIncidenteId?: string;

  @IsString()
  @IsOptional()
  fechaDesde?: string;

  @IsString()
  @IsOptional()
  fechaHasta?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
