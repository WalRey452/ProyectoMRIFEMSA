import { Column, Entity, PrimaryColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Incidente } from './incidente.entity';

@Entity('lecciones_aprendidas')
export class LeccionAprendida {
  @PrimaryColumn('uuid')
  incidenteId: string;

  @OneToOne(() => Incidente, incidente => incidente.leccionAprendida, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenteId' })
  incidente: Incidente;

  @Column('text', { nullable: true })
  queFueBien: string;

  @Column('text', { nullable: true })
  queFueMal: string;

  @Column('text', { nullable: true })
  mejorasPropuestas: string;

  @Column('text', { nullable: true })
  funcionoBien: string;

  @Column('text', { nullable: true })
  fallo: string;

  @Column('text', { nullable: true })
  mejoras: string;

  @Column({ type: 'uuid' })
  creadoPorId: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
