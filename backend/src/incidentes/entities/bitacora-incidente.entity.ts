import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Incidente } from './incidente.entity';

@Entity('bitacoras_incidente')
export class BitacoraIncidente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incidente, incidente => incidente.bitacoras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenteId' })
  incidente: Incidente;

  @Column({ type: 'uuid' })
  incidenteId: string;

  @CreateDateColumn()
  fechaHora: Date;

  @Column('text')
  accionDetallada: string;

  @Column({ type: 'uuid', nullable: true })
  responsableId: string;

  @Column({ nullable: true })
  responsableNombre: string;
}
