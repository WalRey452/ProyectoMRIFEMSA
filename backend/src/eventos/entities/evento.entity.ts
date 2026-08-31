import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { TipoAtaque } from '../enums/evento.enums';
import { Severidad } from '../../incidentes/enums/incidente.enums';
import { EvidenciaEvento } from './evidencia-evento.entity';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigoEvento: string;

  @Column()
  titulo: string;

  @Column()
  origen: string;

  @Column({ nullable: true })
  reportadoPor: string;

  @CreateDateColumn()
  fechaDeteccion: Date;

  @Column({ type: 'enum', enum: Severidad })
  severidad: Severidad;

  @Column({ type: 'enum', enum: TipoAtaque })
  tipo: TipoAtaque;

  @Column({ nullable: true })
  otroTipo: string;

  @Column('text')
  descripcion: string;

  @Column({ type: 'uuid' })
  creadoPorId: string;

  @OneToMany(() => EvidenciaEvento, evidencia => evidencia.evento, { cascade: true })
  evidencias: EvidenciaEvento[];

  @BeforeInsert()
  generateCodigo() {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    this.codigoEvento = `EVT-${year}-${random}`;
  }
}
