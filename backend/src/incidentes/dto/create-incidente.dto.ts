import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaIncidente, Severidad, TLP } from '../enums/incidente.enums';

export class CreateActivoDto {
  @IsString()
  @IsNotEmpty()
  ipHostname: string;

  @IsString()
  @IsOptional()
  tipoActivo?: string;

  @IsString()
  @IsOptional()
  sistemaOperativo?: string;

  @IsString()
  @IsNotEmpty()
  accionTomada: string;
}

export class CreateIncidenteDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsEnum(CategoriaIncidente)
  @IsNotEmpty()
  categoria: CategoriaIncidente;

  @IsString()
  @IsOptional()
  otraCategoria?: string;

  @IsEnum(Severidad)
  @IsNotEmpty()
  severidad: Severidad;

  @IsEnum(TLP)
  @IsOptional()
  tlp?: TLP;

  @IsString()
  @IsNotEmpty()
  resumenEjecutivo: string;

  @IsString()
  @IsOptional()
  liderIncidenteId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActivoDto)
  @IsOptional()
  activos?: CreateActivoDto[];

  @IsString()
  @IsNotEmpty()
  bitacoraInicial: string;

  @IsString()
  @IsOptional()
  reportadoPor?: string;

  @IsString()
  @IsOptional()
  triage?: string;

  @IsString()
  @IsOptional()
  origen?: string;

  @IsString()
  @IsOptional()
  fuenteHerramienta?: string;

  @IsString()
  @IsOptional()
  negocioAfectado?: string;

  @IsString()
  @IsOptional()
  procesoInternoAfectado?: string;

  @IsString()
  @IsOptional()
  afectacion?: string;

  @IsString()
  @IsOptional()
  tipoAfectacion?: string;

  @IsString()
  @IsOptional()
  impacto?: string;

  @IsString()
  @IsOptional()
  criticidadActivo?: string;

  @IsString()
  @IsOptional()
  riesgoAsociado?: string;

  @IsString()
  @IsOptional()
  tieneRespaldo?: string;

  @IsString()
  @IsOptional()
  tienePlanContinuidad?: string;

  @IsString()
  @IsOptional()
  planAccion?: string;

  @IsString()
  @IsOptional()
  responsablePlanAccion?: string;

  @IsOptional()
  fechaCierrePlanAccion?: Date;

  @IsString()
  @IsOptional()
  reportadoEntesExternos?: string;

  @IsOptional()
  leccionesAprendidas?: any;

  @IsOptional()
  lineaTiempo?: any[];
}
