import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Incidente } from './incidente.entity';

@Entity('activos_afectados')
export class ActivoAfectado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incidente, incidente => incidente.activos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenteId' })
  incidente: Incidente;

  @Column({ type: 'uuid' })
  incidenteId: string;

  @Column()
  ipHostname: string;

  @Column({ nullable: true })
  tipoActivo: string;

  @Column({ nullable: true })
  sistemaOperativo: string;

  @Column('text')
  accionTomada: string;

  @CreateDateColumn()
  createdAt: Date;
}
