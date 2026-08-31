import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventosService } from '../../../../core/services/eventos.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatRadioModule, MatSnackBarModule
  ],
  template: `
    <div class="form-container">
      <header class="page-header">
        <h1 class="font-bebas">{{ isEdit() ? 'EDITAR EVENTO' : 'REGISTRAR EVENTO' }}</h1>
        <button mat-icon-button (click)="goBack()"><mat-icon>close</mat-icon></button>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body">
        
        <div class="grid-2">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Título del Evento</mat-label>
            <input matInput formControlName="titulo" placeholder="Ej. Escaneo TCP/443 en Gateway / Oleada de Credential Stuffing en VPN">
            <mat-error>Requerido</mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Tipo de Evento</mat-label>
            <mat-select formControlName="tipo">
              <mat-option *ngFor="let t of tipos" [value]="t.id">{{t.nombre}}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-100" *ngIf="form.get('tipo')?.value === 'OTRO'" style="margin-top: 5px; margin-bottom: 5px;">
          <mat-label>Especifique Otro Tipo de Evento / Ataque</mat-label>
          <input matInput formControlName="otroTipo" placeholder="Ej. Manipulación de hardware físico, Intercepción de señal inalámbrica...">
          <mat-icon matSuffix color="primary">edit_note</mat-icon>
        </mat-form-field>

        <div class="grid-2">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Registrado / Reportado Por</mat-label>
            <input matInput formControlName="reportadoPor" placeholder="Ej. Analista SOC Turno Noche / Alerta SIEM">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Origen (IP, Sistema, Usuario)</mat-label>
            <input matInput formControlName="origen" placeholder="Ej. IP Externa 185.220.101.44 / Firewall Palo Alto / Usuario VPN">
          </mat-form-field>
        </div>

        <div class="grid-2">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Fecha y Hora de Detección</mat-label>
            <input matInput type="datetime-local" formControlName="fechaDeteccion">
          </mat-form-field>
        </div>

        <div class="radio-group-container">
          <label class="section-label">Severidad Inicial*</label>
          <mat-radio-group formControlName="severidad" class="radio-group">
            <mat-radio-button value="BAJA" class="sev-baja">BAJA</mat-radio-button>
            <mat-radio-button value="MEDIA" class="sev-media">MEDIA</mat-radio-button>
            <mat-radio-button value="ALTA" class="sev-alta">ALTA</mat-radio-button>
            <mat-radio-button value="CRITICA" class="sev-critica">CRÍTICA</mat-radio-button>
          </mat-radio-group>
        </div>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Descripción Detallada</mat-label>
          <textarea matInput formControlName="descripcion" rows="5" placeholder="Ej. El firewall perimetral detectó un barrido de puertos de alta velocidad desde un nodo de salida Tor intentando enumerar servicios. Todo el tráfico fue desestimado..."></textarea>
          <mat-error>Requerido</mat-error>
        </mat-form-field>

        <!-- SECCIÓN DE EVIDENCIAS -->
        <div class="mt-20">
          <h3 style="color:#272257; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">Evidencias (Imágenes / Capturas)</h3>
          <div class="file-upload-container">
            <input type="file" #fileInput multiple accept="image/*" (change)="onFileSelected($event)" style="display: none;">
            <button type="button" mat-stroked-button color="primary" (click)="fileInput.click()">
              <mat-icon>cloud_upload</mat-icon> Seleccionar Imágenes
            </button>
            <p class="text-muted" style="font-size:12px; margin-top:10px;">Las imágenes se adjuntarán automáticamente en el reporte PDF.</p>
            
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
                      <input matInput [(ngModel)]="item.descripcion" [ngModelOptions]="{standalone: true}" placeholder="Ej. Captura del bloqueo en firewall Palo Alto o log del IPS">
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

        <div class="form-actions">
          <button type="button" mat-button (click)="goBack()">CANCELAR</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="form.invalid || loading()">
            <mat-icon *ngIf="!loading()">save</mat-icon>
            {{ loading() ? 'GUARDANDO...' : 'GUARDAR EVENTO' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .form-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Montserrat', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; background-color: #272257; color: white; padding: 15px 25px; border-radius: 8px 8px 0 0; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .form-body { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    
    .w-100 { width: 100%; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    
    .section-label { display: block; font-weight: bold; margin-bottom: 10px; color: #272257; }
    .radio-group-container { margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; }
    .radio-group { display: flex; gap: 20px; flex-wrap: wrap; }
    
    ::ng-deep .sev-baja .mat-radio-label-content { color: #16a34a !important; font-weight: bold; }
    ::ng-deep .sev-media .mat-radio-label-content { color: #f59e0b !important; font-weight: bold; }
    ::ng-deep .sev-alta .mat-radio-label-content { color: #ea580c !important; font-weight: bold; }
    ::ng-deep .sev-critica .mat-radio-label-content { color: #dc2626 !important; font-weight: bold; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .file-upload-container { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center; }
    .file-list { margin-top: 15px; text-align: left; }
    .file-list ul { list-style: none; padding: 0; margin: 0; }
    .file-list li.evidence-item { display: flex; flex-direction: column; align-items: stretch; padding: 15px; background: white; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 5px; }
    .evidence-info { display: flex; align-items: center; margin-bottom: 10px; }
    .evidence-info mat-icon { margin-right: 10px; }
    .file-size { color: #94a3b8; font-size: 12px; margin-left: 10px; }
    .evidence-input { flex-grow: 1; }
    .mt-20 { margin-top: 20px; }
  `]
})
export class EventoFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = signal(false);
  eventoId = signal<string | null>(null);
  loading = signal(false);
  selectedFiles: { file: File, descripcion: string }[] = [];

  tipos = [
    { id: 'MALWARE', nombre: 'Malware Genérico' },
    { id: 'RANSOMWARE', nombre: 'Ransomware / Doble Extorsión' },
    { id: 'PHISHING', nombre: 'Phishing / Spear Phishing' },
    { id: 'DDOS', nombre: 'Denegación de Servicio (DDoS)' },
    { id: 'EXFILTRACION', nombre: 'Exfiltración / Fuga de Datos' },
    { id: 'ESCANEO_PUERTOS', nombre: 'Escaneo de Puertos / Reconocimiento' },
    { id: 'FUERZA_BRUTA', nombre: 'Fuerza Bruta / Credential Stuffing' },
    { id: 'COMPROMISO_CUENTA', nombre: 'Compromiso de Cuenta / Sesión' },
    { id: 'OTRO', nombre: 'OTRO' }
  ];

  constructor(
    private fb: FormBuilder,
    private service: EventosService,
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
      this.eventoId.set(id);
      this.loadData(id);
    } else {
      // Set default datetime
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      this.form.patchValue({ fechaDeteccion: now.toISOString().slice(0, 16) });
    }
  }

  initForm() {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      tipo: ['', Validators.required],
      otroTipo: [''],
      reportadoPor: ['', Validators.required],
      origen: ['', Validators.required],
      severidad: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaDeteccion: ['', Validators.required]
    });
  }

  loadData(id: string) {
    this.service.getOne(id).subscribe({
      next: (data) => {
        if(data) {
          // Format date for datetime-local input
          if (data.fechaDeteccion) {
            const d = new Date(data.fechaDeteccion);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            data.fechaDeteccion = d.toISOString().slice(0, 16);
          }
          this.form.patchValue(data);
        }
      }
    });
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

  onSubmit() {
    if (this.form.invalid) return;
    
    this.loading.set(true);
    const data = this.form.value;
    
    if (this.isEdit()) {
      this.service.update(this.eventoId()!, data).subscribe({
        next: (res) => {
          this.snackBar.open('Evento guardado correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/eventos', this.eventoId()]);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error al guardar el evento', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.service.create(data).subscribe({
        next: (res: any) => {
          if (this.selectedFiles.length > 0 && res.id) {
            this.snackBar.open('Evento creado, subiendo evidencias...', '', { duration: 2000 });
            const uploadTasks = this.selectedFiles.map(item => {
              const formData = new FormData();
              formData.append('file', item.file);
              formData.append('descripcion', item.descripcion || 'Evidencia adjunta');
              return this.service.uploadEvidencia(res.id, formData).pipe(
                catchError(() => of(null))
              );
            });
            
            forkJoin(uploadTasks).subscribe(() => {
              this.snackBar.open('Evento y evidencias registrados correctamente', 'Cerrar', { duration: 3000 });
              this.router.navigate(['/eventos']);
            });
          } else {
            this.snackBar.open('Evento registrado correctamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/eventos']);
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error al guardar el evento', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/eventos']);
  }
}
