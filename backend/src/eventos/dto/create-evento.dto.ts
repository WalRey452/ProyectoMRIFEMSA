import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoAtaque } from '../enums/evento.enums';
import { Severidad } from '../../incidentes/enums/incidente.enums';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  origen: string;

  @IsEnum(Severidad)
  @IsNotEmpty()
  severidad: Severidad;

  @IsEnum(TipoAtaque)
  @IsNotEmpty()
  tipo: TipoAtaque;

  @IsString()
  @IsOptional()
  otroTipo?: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsOptional()
  reportadoPor?: string;
}
