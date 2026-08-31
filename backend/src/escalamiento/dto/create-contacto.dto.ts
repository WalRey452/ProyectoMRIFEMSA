import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { NivelEscalamiento } from '../enums/escalamiento.enums';

export class CreateContactoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  cargo: string;

  @IsEnum(NivelEscalamiento)
  @IsNotEmpty()
  nivel: NivelEscalamiento;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsOptional()
  empresa?: string;

  @IsString()
  @IsOptional()
  negocio?: string;

  @IsString()
  @IsOptional()
  disponibilidad?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
