import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IncidentesService } from '../../../../core/services/incidentes.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-incidente-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatRadioModule, MatDatepickerModule,
    MatNativeDateModule, MatSnackBarModule
  ],
  template: `
    <div class="form-container">
      <header class="page-header">
        <h1 class="font-bebas">{{ isEdit() ? 'EDITAR INCIDENTE' : 'NUEVO INCIDENTE' }}</h1>
        <button mat-icon-button (click)="goBack()"><mat-icon>close</mat-icon></button>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body">
        <mat-tab-group>
          
          <!-- PESTAÑA 1: Información General -->
          <mat-tab label="1. Información General">
            <div class="tab-content">
              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Título del Incidente</mat-label>
                  <input matInput formControlName="titulo" placeholder="Ej. Ransomware en Servidor de Facturación / Phishing en Nómina">
                  <mat-error>Requerido</mat-error>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de Incidente (Categoría)</mat-label>
                  <mat-select formControlName="categoria">
                    <mat-option *ngFor="let cat of categorias" [value]="cat.id">{{cat.nombre}}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-100" *ngIf="form.get('categoria')?.value === 'OTRO'" style="margin-top: 15px;">
                <mat-label>Especifique Otra Categoría de Incidente</mat-label>
                <input matInput formControlName="otraCategoria" placeholder="Ej. Robo de hardware físico, Desastre natural, Intercepción inalámbrica...">
                <mat-icon matSuffix color="primary">edit_note</mat-icon>
              </mat-form-field>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Fecha y Hora de Ocurrencia</mat-label>
                  <input matInput [matDatepicker]="pickerOc" formControlName="fechaIdentificacion">
                  <mat-datepicker-toggle matIconSuffix [for]="pickerOc"></mat-datepicker-toggle>
                  <mat-datepicker #pickerOc></mat-datepicker>
                  <mat-error>Requerido</mat-error>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Fecha de Reporte</mat-label>
                  <input matInput [matDatepicker]="pickerRep" formControlName="fechaReporte">
                  <mat-datepicker-toggle matIconSuffix [for]="pickerRep"></mat-datepicker-toggle>
                  <mat-datepicker #pickerRep></mat-datepicker>
                </mat-form-field>
              </div>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Reportado Por</mat-label>
                  <input matInput formControlName="reportadoPor" placeholder="Ej. Analista SOC / Alerta SIEM automática / Usuario RRHH">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Líder Asignado al Incidente</mat-label>
                  <mat-select formControlName="liderId">
                    <mat-option value="Administrador CSIRT">Administrador CSIRT</mat-option>
                    <mat-option value="Analista T1">Analista Nivel 1</mat-option>
                    <mat-option value="Analista T2">Analista Nivel 2</mat-option>
                    <mat-option value="Especialista FORENSIC">Especialista Forense</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="estado">
                    <mat-option value="ABIERTO">ABIERTO</mat-option>
                    <mat-option value="CONTENCION">EN CONTENCIÓN</mat-option>
                    <mat-option value="ERRADICACION">ERRADICADO</mat-option>
                    <mat-option value="RECUPERACION">EN RECUPERACIÓN</mat-option>
                    <mat-option value="CERRADO">CERRADO</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Triage (Evaluación Inicial)</mat-label>
                  <mat-select formControlName="triage">
                    <mat-option value="Incidente Confirmado">Incidente Confirmado</mat-option>
                    <mat-option value="Bajo Observación">Bajo Observación</mat-option>
                    <mat-option value="Falso Positivo">Falso Positivo</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 2: Descripción y Origen -->
          <mat-tab label="2. Descripción y Origen">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Descripción General del Incidente</mat-label>
                <textarea matInput formControlName="resumenEjecutivo" rows="5" placeholder="Ej. Se detectó cifrado de archivos .lockbit en el servidor ERP-FACT-01 alterando el cobro en sucursales. El SOC activó el protocolo de contención inmediata..."></textarea>
                <mat-error>Requerido</mat-error>
              </mat-form-field>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Origen</mat-label>
                  <input matInput formControlName="origen" placeholder="Ej. Correo phishing externo / IP maliciosa 185.220.x.x / USB no autorizado">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fuente / Herramienta</mat-label>
                  <input matInput formControlName="fuenteHerramienta" placeholder="Ej. SIEM Splunk / EDR CrowdStrike / Alerta Usuario">
                </mat-form-field>
              </div>

              <div class="radio-group-container mt-20">
                <label class="section-label">Severidad del Incidente*</label>
                <mat-radio-group formControlName="severidad" class="radio-group">
                  <mat-radio-button value="BAJA" class="sev-baja">BAJA</mat-radio-button>
                  <mat-radio-button value="MEDIA" class="sev-media">MEDIA</mat-radio-button>
                  <mat-radio-button value="ALTA" class="sev-alta">ALTA</mat-radio-button>
                  <mat-radio-button value="CRITICA" class="sev-critica">CRÍTICA</mat-radio-button>
                </mat-radio-group>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 3: Impacto y Afectación -->
          <mat-tab label="3. Impacto y Afectación">
            <div class="tab-content">
              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Negocio Afectado</mat-label>
                  <input matInput formControlName="negocioAfectado" placeholder="Ej. Ventas Farmacia, Logística">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Proceso Interno Afectado</mat-label>
                  <input matInput formControlName="procesoInternoAfectado" placeholder="Ej. Facturación, Nómina">
                </mat-form-field>
              </div>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Afectación</mat-label>
                  <input matInput formControlName="afectacion" placeholder="Ej. Interrupción total del sistema de cobros en farmacias">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Tipo de Afectación</mat-label>
                  <input matInput formControlName="tipoAfectacion" placeholder="Ej. Operativa / Financiera / Reputacional">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Impacto Detallado</mat-label>
                <textarea matInput formControlName="impacto" rows="3" placeholder="Ej. Retraso de 2 horas en entrega de medicamentos y pérdida temporal de conectividad en turno matutino"></textarea>
              </mat-form-field>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Criticidad del Activo</mat-label>
                  <mat-select formControlName="criticidadActivo">
                    <mat-option value="Crítico">Crítico</mat-option>
                    <mat-option value="Alto">Alto</mat-option>
                    <mat-option value="Medio">Medio</mat-option>
                    <mat-option value="Bajo">Bajo</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Riesgo Asociado</mat-label>
                  <input matInput formControlName="riesgoAsociado" placeholder="Ej. Propagación de malware a VLAN corporativa o robo de credenciales">
                </mat-form-field>
              </div>

              <div class="grid-2 mt-20">
                <div class="radio-box">
                  <label class="section-label mb-10">¿Tiene Respaldo?</label>
                  <mat-radio-group formControlName="tieneRespaldo">
                    <mat-radio-button value="SI">Sí</mat-radio-button>
                    <mat-radio-button value="NO">No</mat-radio-button>
                  </mat-radio-group>
                </div>
                
                <div class="radio-box">
                  <label class="section-label mb-10">¿Tiene Plan de Continuidad?</label>
                  <mat-radio-group formControlName="tienePlanContinuidad">
                    <mat-radio-button value="SI">Sí</mat-radio-button>
                    <mat-radio-button value="NO">No</mat-radio-button>
                  </mat-radio-group>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 4: Plan de Acción -->
          <mat-tab label="4. Plan de Acción">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Plan de Acción Generado</mat-label>
                <textarea matInput formControlName="planAccion" rows="3" placeholder="Ej. 1. Aislamiento de servidores afectados. 2. Restauración desde backup inmutable. 3. Rotación de credenciales."></textarea>
              </mat-form-field>

              <div class="grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Responsable del Plan de Acción</mat-label>
                  <input matInput formControlName="responsablePlanAccion" placeholder="Ej. Equipo Forense CSIRT / Administrador de Redes">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fecha de Cierre del Plan de Acción</mat-label>
                  <input matInput [matDatepicker]="pickerCierre" formControlName="fechaCierrePlanAccion">
                  <mat-datepicker-toggle matIconSuffix [for]="pickerCierre"></mat-datepicker-toggle>
                  <mat-datepicker #pickerCierre></mat-datepicker>
                </mat-form-field>
              </div>

              <div class="radio-box mb-20">
                <label class="section-label mb-10">¿Reportado a Entes Externos?</label>
                <mat-radio-group formControlName="reportadoEntesExternos">
                  <mat-radio-button value="SI">Sí</mat-radio-button>
                  <mat-radio-button value="NO">No</mat-radio-button>
                </mat-radio-group>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 5: Matrices Dinámicas (Activos y Cronología) -->
          <mat-tab label="5. Activos y Cronología">
            <div class="tab-content" style="padding-top: 10px;">
              <!-- Activos -->
              <div formArrayName="activosAfectados">
                <div class="assets-header">
                  <h3 class="font-bebas section-subtitle">Matriz de Activos Comprometidos</h3>
                  <button type="button" mat-raised-button color="primary" (click)="addActivo()">
                    <mat-icon>add</mat-icon> Añadir Activo
                  </button>
                </div>
                
                <div class="asset-card" *ngFor="let activo of activos.controls; let i=index" [formGroupName]="i">
                  <div class="asset-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>IP o Hostname</mat-label>
                      <input matInput formControlName="ipHostname" placeholder="Ej. 10.24.10.15 (ERP-FACT-01)">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de Activo</mat-label>
                      <input matInput formControlName="tipoActivo" placeholder="Ej. Servidor ERP, POS, DB Oracle">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Sistema Operativo</mat-label>
                      <input matInput formControlName="so" placeholder="Ej. Windows Server 2019 / RHEL 8">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Acción Tomada</mat-label>
                      <input matInput formControlName="accionTomada" placeholder="Ej. Aislamiento de LAN y bloqueo en firewall">
                    </mat-form-field>
                  </div>
                  <button type="button" mat-icon-button color="warn" (click)="removeActivo(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Cronología -->
              <div formArrayName="lineaTiempo" class="mt-20">
                <div class="assets-header">
                  <h3 class="font-bebas section-subtitle">Línea de Tiempo y Decisiones</h3>
                  <button type="button" mat-raised-button color="primary" (click)="addLineaTiempo()">
                    <mat-icon>add_chart</mat-icon> Registrar Decisión
                  </button>
                </div>
                
                <div class="asset-card timeline-card" *ngFor="let evento of lineaTiempo.controls; let i=index" [formGroupName]="i">
                  <div class="grid-2">
                    <mat-form-field appearance="outline">
                      <mat-label>Fecha y Hora</mat-label>
                      <input matInput formControlName="fechaHora" type="datetime-local">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Responsable</mat-label>
                      <input matInput formControlName="responsable" placeholder="Ej. Analista SOC / Forense">
                    </mat-form-field>
                  </div>
                  <div class="grid-2">
                    <mat-form-field appearance="outline">
                      <mat-label>Acción o Decisión</mat-label>
                      <input matInput formControlName="accion" placeholder="Ej. Aislamiento preventivo y toma de snapshot forense">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Impacto de la Decisión</mat-label>
                      <input matInput formControlName="impacto" placeholder="Ej. Contención inmediata en sucursal">
                    </mat-form-field>
                  </div>
                  <button type="button" mat-icon-button color="warn" (click)="removeLineaTiempo(i)" class="delete-btn-corner">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- SECCIÓN DE EVIDENCIAS -->
              <div class="mt-30" style="margin-top: 30px;">
                <h3 class="font-bebas section-subtitle"><mat-icon>image</mat-icon> EVIDENCIAS (Imágenes / Capturas)</h3>
                <p style="color: #64748b; margin-bottom: 15px;">Adjunta capturas de pantalla de los activos afectados, logs o pruebas de la bitácora. Estas imágenes se integrarán automáticamente en los anexos del informe PDF.</p>
                <div class="file-upload-container">
                  <input type="file" #fileInput multiple accept="image/*" (change)="onFileSelected($event)" style="display: none;">
                  <button type="button" mat-stroked-button color="primary" (click)="fileInput.click()">
                    <mat-icon>cloud_upload</mat-icon> Seleccionar Imágenes
                  </button>
                  
                  <div class="file-list" *ngIf="selectedFiles.length > 0">
                    <ul>
                      <li *ngFor="let item of selectedFiles; let i = index" class="evidence-item">
                        <div class="evidence-info">
                          <mat-icon color="primary">image</mat-icon> 
                          <strong>{{item.file.name}}</strong> 
                          <span class="file-size">({{(item.file.size / 1024).toFixed(1)}} KB)</span>
                        </div>
                        <div class="evidence-input">
                          <mat-form-field appearance="outline" class="w-100" style="margin-bottom: -15px;">
                            <mat-label>Descripción de la Evidencia</mat-label>
                            <input matInput [(ngModel)]="item.descripcion" [ngModelOptions]="{standalone: true}" placeholder="Ej. Captura del ransomware en el Servidor Web">
                          </mat-form-field>
                        </div>
                        <button type="button" mat-icon-button color="warn" (click)="removeFile(i)" title="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </mat-tab>

          <!-- PESTAÑA 6: Cierre (Lecciones Aprendidas) -->
          <mat-tab label="6. Cierre (Lecciones Aprendidas)">
            <div class="tab-content">
              <h3 class="font-bebas section-subtitle"><mat-icon>school</mat-icon> LECCIONES APRENDIDAS</h3>
              <p style="color: #64748b; margin-bottom: 20px;">Llene este formulario únicamente cuando el incidente haya sido erradicado y esté en proceso de cierre o mejora continua.</p>
              
              <div formGroupName="leccionesAprendidas">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>¿Qué funcionó bien?</mat-label>
                  <textarea matInput formControlName="funcionoBien" rows="3" placeholder="Ej. Detección temprana por el SOC en menos de 10 min y activación ágil del plan de contención."></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>¿Qué falló o se debe mejorar?</mat-label>
                  <textarea matInput formControlName="fallo" rows="3" placeholder="Ej. El protocolo SMBv1 permanecía habilitado entre VLANs legacy de desarrollo y producción."></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Plan de Mejora Continua (Sugerencias)</mat-label>
                  <textarea matInput formControlName="mejoras" rows="3" placeholder="Ej. Implementar segmentación Zero Trust, deshabilitar protocolos legacy, capacitar en Phishing."></textarea>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>

        </mat-tab-group>

        <div class="form-actions">
          <button type="button" mat-button (click)="goBack()">CANCELAR</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="loading()">
            <mat-icon *ngIf="!loading()">save</mat-icon>
            {{ loading() ? 'GUARDANDO...' : 'GUARDAR INCIDENTE' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .form-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Montserrat', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; background-color: #272257; color: white; padding: 15px 25px; border-radius: 8px 8px 0 0; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .form-body { background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    
    .tab-content { padding: 30px; }
    .w-100 { width: 100%; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .mt-20 { margin-top: 20px; }
    .mb-10 { margin-bottom: 10px; }
    .mb-20 { margin-bottom: 20px; }
    
    .section-label { display: block; font-weight: bold; margin-bottom: 5px; color: #272257; }
    .section-subtitle { display: flex; align-items: center; gap: 8px; color: #272257; font-size: 22px; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    
    .radio-group-container { background: #f8fafc; padding: 15px; border-radius: 8px; }
    .radio-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .radio-group { display: flex; gap: 20px; flex-wrap: wrap; }
    
    ::ng-deep .sev-baja .mat-radio-label-content { color: #16a34a !important; font-weight: bold; }
    ::ng-deep .sev-media .mat-radio-label-content { color: #f59e0b !important; font-weight: bold; }
    ::ng-deep .sev-alta .mat-radio-label-content { color: #ea580c !important; font-weight: bold; }
    ::ng-deep .sev-critica .mat-radio-label-content { color: #dc2626 !important; font-weight: bold; }
    
    .assets-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .asset-card { display: flex; align-items: flex-start; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #272257; position: relative; }
    .timeline-card { border-left-color: #2563eb; }
    .asset-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; width: 100%; }
    .delete-btn-corner { position: absolute; right: 5px; top: 5px; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 15px; padding: 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; border-radius: 0 0 8px 8px; }
    .file-upload-container { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center; }
    .file-list { margin-top: 15px; text-align: left; }
    .file-list ul { list-style: none; padding: 0; margin: 0; }
    .file-list li.evidence-item { display: flex; flex-direction: column; align-items: stretch; padding: 15px; }
    .evidence-info { display: flex; align-items: center; margin-bottom: 10px; }
    .evidence-info mat-icon { margin-right: 10px; }
    .file-size { color: #94a3b8; font-size: 12px; margin-left: 10px; }
    .evidence-input { flex-grow: 1; }
  `]
})
export class IncidenteFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = signal(false);
  incidenteId = signal<string | null>(null);
  loading = signal(false);
  selectedFiles: { file: File, descripcion: string }[] = [];

  categorias = [
    { id: 'MALWARE', nombre: 'Malware Genérico' },
    { id: 'RANSOMWARE', nombre: 'Ransomware / Doble Extorsión' },
    { id: 'PHISHING', nombre: 'Phishing / Spear Phishing' },
    { id: 'INGENIERIA_SOCIAL', nombre: 'Ingeniería Social (BEC)' },
    { id: 'DENEGACION_SERVICIO', nombre: 'Denegación de Servicio (DDoS)' },
    { id: 'ACCESO_NO_AUTORIZADO', nombre: 'Acceso No Autorizado / Intrusión' },
    { id: 'COMPROMISO_CUENTA', nombre: 'Compromiso de Cuenta' },
    { id: 'EXFILTRACION', nombre: 'Exfiltración' },
    { id: 'FUGA_DATOS', nombre: 'Fuga de Datos' },
    { id: 'USO_INADECUADO', nombre: 'Uso Inadecuado' },
    { id: 'VULNERABILIDAD', nombre: 'Vulnerabilidad Explotada / Zero-Day' },
    { id: 'OTRO', nombre: 'OTRO' }
  ];

  constructor(
    private fb: FormBuilder,
    private service: IncidentesService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.incidenteId.set(id);
      this.loadData(id);
    }
  }

  initForm() {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      fechaIdentificacion: [new Date(), Validators.required],
      fechaReporte: [new Date()],
      categoria: ['MALWARE'],
      otraCategoria: [''],
      severidad: ['MEDIA', Validators.required],
      resumenEjecutivo: ['', [Validators.required, Validators.minLength(10)]],
      liderId: ['Administrador CSIRT'],
      reportadoPor: [''],
      origen: [''],
      fuenteHerramienta: [''],
      triage: ['Incidente Confirmado'],
      estado: ['ABIERTO'],
      
      negocioAfectado: [''],
      procesoInternoAfectado: [''],
      afectacion: [''],
      tipoAfectacion: [''],
      impacto: [''],
      criticidadActivo: ['Medio'],
      riesgoAsociado: [''],
      tieneRespaldo: ['NO'],
      tienePlanContinuidad: ['NO'],

      planAccion: [''],
      responsablePlanAccion: [''],
      fechaCierrePlanAccion: [''],
      reportadoEntesExternos: ['NO'],

      leccionesAprendidas: this.fb.group({
        funcionoBien: [''],
        fallo: [''],
        mejoras: ['']
      }),

      activosAfectados: this.fb.array([]),
      lineaTiempo: this.fb.array([])
    });
  }

  get activos() {
    return this.form.get('activosAfectados') as FormArray;
  }

  get lineaTiempo() {
    return this.form.get('lineaTiempo') as FormArray;
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push({ file: files.item(i)!, descripcion: '' });
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  addActivo(activo?: any) {
    this.activos.push(this.fb.group({
      ipHostname: [activo?.ipHostname || ''],
      tipoActivo: [activo?.tipoActivo || ''],
      so: [activo?.so || ''],
      accionTomada: [activo?.accionTomada || '']
    }));
  }

  removeActivo(index: number) {
    this.activos.removeAt(index);
  }

  addLineaTiempo(item?: any) {
    this.lineaTiempo.push(this.fb.group({
      fechaHora: [item?.fechaHora ? new Date(item.fechaHora).toISOString().slice(0, 16) : ''],
      responsable: [item?.responsable || ''],
      accion: [item?.accion || ''],
      impacto: [item?.impacto || '']
    }));
  }

  removeLineaTiempo(index: number) {
    this.lineaTiempo.removeAt(index);
  }

  loadData(id: string) {
    this.service.getOne(id).subscribe({
      next: (res) => {
        if(res) {
          this.form.patchValue(res);
          
          if(res.activosAfectados) {
            res.activosAfectados.forEach((a: any) => this.addActivo(a));
          }
          if(res.lineaTiempo) {
            res.lineaTiempo.forEach((l: any) => this.addLineaTiempo(l));
          }
        }
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const missing: string[] = [];
      if (this.form.get('titulo')?.invalid) missing.push('Título (Pestaña 1)');
      if (this.form.get('severidad')?.invalid) missing.push('Severidad (Pestaña 2)');
      if (this.form.get('resumenEjecutivo')?.invalid) missing.push('Descripción General mín. 10 caracteres (Pestaña 2)');
      const msg = missing.length > 0 ? `Faltan campos: ${missing.join(', ')}` : 'Complete todos los campos requeridos en las pestañas.';
      this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      return;
    }

    this.loading.set(true);
    const data = this.form.value;
    
    const payload = {
      titulo: data.titulo,
      categoria: data.categoria,
      otraCategoria: data.otraCategoria,
      severidad: data.severidad,
      estado: data.estado,
      resumenEjecutivo: data.resumenEjecutivo,
      bitacoraInicial: 'Incidente registrado mediante formulario principal.',
      reportadoPor: data.reportadoPor || 'Administrador CSIRT (SOC)',
      tlp: data.tlp || 'AMBER',
      liderIncidenteId: data.liderId,
      triage: data.triage,
      origen: data.origen,
      fuenteHerramienta: data.fuenteHerramienta,
      negocioAfectado: data.negocioAfectado,
      procesoInternoAfectado: data.procesoInternoAfectado,
      afectacion: data.afectacion,
      tipoAfectacion: data.tipoAfectacion,
      impacto: data.impacto,
      criticidadActivo: data.criticidadActivo,
      riesgoAsociado: data.riesgoAsociado,
      tieneRespaldo: data.tieneRespaldo,
      tienePlanContinuidad: data.tienePlanContinuidad,
      planAccion: data.planAccion,
      responsablePlanAccion: data.responsablePlanAccion,
      fechaCierrePlanAccion: data.fechaCierrePlanAccion,
      reportadoEntesExternos: data.reportadoEntesExternos,
      activos: data.activosAfectados.filter((a:any) => a.ipHostname).map((a: any) => ({
        ipHostname: a.ipHostname,
        sistemaOperativo: a.so || 'Desconocido',
        accionTomada: a.accionTomada || 'Ninguna',
        tipoActivo: a.tipoActivo || 'Servidor'
      })),
      lineaTiempo: data.lineaTiempo,
      leccionesAprendidas: data.leccionesAprendidas
    };

    if (this.isEdit() && this.incidenteId()) {
      this.service.update(this.incidenteId()!, payload).subscribe({
        next: () => {
          if (this.selectedFiles.length > 0) {
            this.snackBar.open('Incidente actualizado, subiendo evidencias...', '', { duration: 2000 });
            const uploadTasks = this.selectedFiles.map(item => {
              const formData = new FormData();
              formData.append('file', item.file);
              formData.append('descripcion', item.descripcion || 'Evidencia adjunta');
              return this.service.uploadEvidencia(this.incidenteId()!, formData).pipe(
                catchError(() => of(null))
              );
            });
            
            forkJoin(uploadTasks).subscribe(() => {
              this.snackBar.open('Incidente y evidencias actualizados correctamente', 'Cerrar', { duration: 3000 });
              this.router.navigate(['/incidentes']);
            });
          } else {
            this.snackBar.open('Incidente actualizado correctamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/incidentes']);
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al actualizar incidente', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: (res: any) => {
          if (this.selectedFiles.length > 0 && res.id) {
            this.snackBar.open('Incidente creado, subiendo evidencias...', '', { duration: 2000 });
            const uploadTasks = this.selectedFiles.map(item => {
              const formData = new FormData();
              formData.append('file', item.file);
              formData.append('descripcion', item.descripcion || 'Evidencia adjunta');
              return this.service.uploadEvidencia(res.id, formData).pipe(
                catchError(() => of(null))
              );
            });
            
            forkJoin(uploadTasks).subscribe(() => {
              this.snackBar.open('Incidente y evidencias registrados correctamente', 'Cerrar', { duration: 3000 });
              this.router.navigate(['/incidentes']);
            });
          } else {
            this.snackBar.open('Incidente registrado correctamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/incidentes']);
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al crear incidente', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/incidentes']);
  }
}
