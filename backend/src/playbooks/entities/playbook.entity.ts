import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('playbooks')
export class Playbook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  archivoUrl: string;

  // Contenido del PDF almacenado directamente en la BD
  @Column({ type: 'bytea', nullable: true, select: false })
  archivoData: Buffer;

  @Column({ nullable: true })
  originalFilename: string;

  @Column({ type: 'int', default: 0 })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  categoria: string;

  @Column({ nullable: true })
  version: string;

  @Column({ type: 'uuid', nullable: true })
  subidoPorId: string;

  @CreateDateColumn()
  fechaSubida: Date;

  @UpdateDateColumn()
  ultimaActualizacion: Date;
}
