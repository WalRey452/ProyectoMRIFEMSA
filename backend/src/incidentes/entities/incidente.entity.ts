import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { CategoriaIncidente, EstadoIncidente, Severidad, TLP } from '../enums/incidente.enums';
import { ActivoAfectado } from './activo-afectado.entity';
import { BitacoraIncidente } from './bitacora-incidente.entity';
import { EvidenciaIncidente } from './evidencia-incidente.entity';
import { LeccionAprendida } from './leccion-aprendida.entity';
import { User } from '../../users/entities/user.entity';

@Entity('incidentes')
export class Incidente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigoIncidente: string;

  @Column()
  titulo: string;

  @Column({ type: 'enum', enum: CategoriaIncidente })
  categoria: CategoriaIncidente;

  @Column({ nullable: true })
  otraCategoria: string;

  @Column({ type: 'enum', enum: Severidad })
  severidad: Severidad;

  @Column({ type: 'enum', enum: TLP, default: TLP.AMBER })
  tlp: TLP;

  @Column({ type: 'enum', enum: EstadoIncidente, default: EstadoIncidente.ABIERTO })
  estado: EstadoIncidente;

  @CreateDateColumn()
  fechaIdentificacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaCierre: Date;

  @Column('text')
  resumenEjecutivo: string;

  @Column({ nullable: true })
  liderIncidenteId: string;

  @Column({ type: 'uuid', nullable: true })
  creadoPorId: string;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'creadoPorId' })
  creadoPor: User;

  @Column({ nullable: true })
  reportadoPor: string;

  @Column({ nullable: true })
  triage: string;

  @Column({ nullable: true })
  origen: string;

  @Column({ nullable: true })
  fuenteHerramienta: string;

  @Column({ nullable: true })
  negocioAfectado: string;

  @Column({ nullable: true })
  procesoInternoAfectado: string;

  @Column({ nullable: true })
  afectacion: string;

  @Column({ nullable: true })
  tipoAfectacion: string;

  @Column({ nullable: true })
  impacto: string;

  @Column({ nullable: true })
  criticidadActivo: string;

  @Column({ nullable: true })
  riesgoAsociado: string;

  @Column({ nullable: true })
  tieneRespaldo: string;

  @Column({ nullable: true })
  tienePlanContinuidad: string;

  @Column({ nullable: true })
  planAccion: string;

  @Column({ nullable: true })
  responsablePlanAccion: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaCierrePlanAccion: Date;

  @Column({ nullable: true })
  reportadoEntesExternos: string;

  @OneToMany(() => ActivoAfectado, activo => activo.incidente, { cascade: true })
  activos: ActivoAfectado[];

  @OneToMany(() => BitacoraIncidente, bitacora => bitacora.incidente, { cascade: true })
  bitacoras: BitacoraIncidente[];

  @OneToMany(() => EvidenciaIncidente, evidencia => evidencia.incidente, { cascade: true })
  evidencias: EvidenciaIncidente[];

  @OneToOne(() => LeccionAprendida, leccion => leccion.incidente, { cascade: true })
  leccionAprendida: LeccionAprendida;

  @BeforeInsert()
  generateCodigo() {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900); // 3 digits
    this.codigoIncidente = `INC-${year}-${random}`;
  }

  @BeforeUpdate()
  checkFechaCierre() {
    if (this.estado === EstadoIncidente.CERRADO && !this.fechaCierre) {
      this.fechaCierre = new Date();
    }
  }
}
