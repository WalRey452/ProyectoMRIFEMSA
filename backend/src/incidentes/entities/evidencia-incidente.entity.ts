import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Incidente } from './incidente.entity';

@Entity('evidencias_incidente')
export class EvidenciaIncidente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incidente, incidente => incidente.evidencias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenteId' })
  incidente: Incidente;

  @Column({ type: 'uuid' })
  incidenteId: string;

  @Column()
  descripcion: string;

  @Column({ nullable: true })
  archivoHash: string; // SHA-256

  @Column()
  archivoUrl: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;
}
