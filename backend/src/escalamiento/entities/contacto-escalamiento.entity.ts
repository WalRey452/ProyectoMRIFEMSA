import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NivelEscalamiento } from '../enums/escalamiento.enums';

@Entity('contactos_escalamiento')
export class ContactoEscalamiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  cargo: string;

  @Column({ type: 'enum', enum: NivelEscalamiento })
  nivel: NivelEscalamiento;

  @Column()
  telefono: string;

  @Column()
  correo: string;

  @Column({ nullable: true })
  empresa: string;

  @Column({ nullable: true })
  negocio: string;

  @Column({ default: '24/7' })
  disponibilidad: string;

  @Column('text', { nullable: true })
  notas: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
