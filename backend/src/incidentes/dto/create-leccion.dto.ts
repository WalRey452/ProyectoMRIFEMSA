import { IsOptional, IsString } from 'class-validator';

export class CreateLeccionDto {
  @IsString()
  @IsOptional()
  queFueBien?: string;

  @IsString()
  @IsOptional()
  queFueMal?: string;

  @IsString()
  @IsOptional()
  mejorasPropuestas?: string;

  @IsString()
  @IsOptional()
  funcionoBien?: string;

  @IsString()
  @IsOptional()
  fallo?: string;

  @IsString()
  @IsOptional()
  mejoras?: string;
}
