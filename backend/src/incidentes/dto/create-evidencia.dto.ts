import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEvidenciaDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsOptional()
  archivoHash?: string;
}
