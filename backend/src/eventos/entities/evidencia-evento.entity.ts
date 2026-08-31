import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Evento } from './evento.entity';

@Entity('evidencias_evento')
export class EvidenciaEvento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Evento, evento => evento.evidencias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventoId' })
  evento: Evento;

  @Column({ type: 'uuid' })
  eventoId: string;

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
