import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlaybookDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  version?: string;
}
