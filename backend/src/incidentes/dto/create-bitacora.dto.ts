import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBitacoraDto {
  @IsUUID()
  @IsNotEmpty()
  incidenteId: string;

  @IsString()
  @IsNotEmpty()
  accionDetallada: string;
}
