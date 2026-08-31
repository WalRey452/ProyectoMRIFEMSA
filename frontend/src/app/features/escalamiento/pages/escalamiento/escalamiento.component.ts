import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EscalamientoService } from '../../../../core/services/escalamiento.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-contacto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title style="font-family:'Bebas Neue',sans-serif; font-size:1.6rem; letter-spacing:1px; color:#272257;">
      <mat-icon style="vertical-align:middle; margin-right:8px;">{{ data?.contacto ? 'edit' : 'person_add' }}</mat-icon>
      {{ data?.contacto ? 'Editar Contacto' : 'Nuevo Contacto de Escalamiento' }}
    </h2>
    <mat-dialog-content style="min-width:500px; padding-top:8px;">
      <form [formGroup]="form" class="dialog-form">

        <div class="form-row-2">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre Completo</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="nombre" placeholder="Ej. Walter Reyes">
            <mat-error>Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Cargo / Rol</mat-label>
            <mat-icon matPrefix>work</mat-icon>
            <input matInput formControlName="cargo" placeholder="Ej. Líder CSIRT">
            <mat-error>Requerido</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row-2">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Empresa / Organización</mat-label>
            <mat-icon matPrefix>business</mat-icon>
            <input matInput formControlName="empresa" placeholder="Ej. FEMSA Salud">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Negocio / Área</mat-label>
            <mat-icon matPrefix>category</mat-icon>
            <input matInput formControlName="negocio" placeholder="Ej. TI / Seguridad">
          </mat-form-field>
        </div>

        <div class="nivel-section">
          <label class="nivel-label">Nivel de Escalamiento *</label>
          <mat-radio-group formControlName="nivel" class="nivel-group">
            <mat-radio-button value="L1" class="nivel-l1">
              <span class="nivel-chip l1">L1</span>
              <span class="nivel-desc">Soporte inicial</span>
            </mat-radio-button>
            <mat-radio-button value="L2" class="nivel-l2">
              <span class="nivel-chip l2">L2</span>
              <span class="nivel-desc">Análisis</span>
            </mat-radio-button>
            <mat-radio-button value="L3" class="nivel-l3">
              <span class="nivel-chip l3">L3</span>
              <span class="nivel-desc">Especialistas</span>
            </mat-radio-button>
            <mat-radio-button value="L4" class="nivel-l4">
              <span class="nivel-chip l4">L4</span>
              <span class="nivel-desc">Dirección</span>
            </mat-radio-button>
          </mat-radio-group>
        </div>

        <div class="form-row-2">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Teléfono / WhatsApp</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput formControlName="telefono" placeholder="Ej. +54 9 11 1234-5678">
            <mat-error>Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Correo Electrónico</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="correo" placeholder="usuario@empresa.com">
            <mat-error>Correo inválido</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Disponibilidad</mat-label>
          <mat-icon matPrefix>schedule</mat-icon>
          <mat-select formControlName="disponibilidad">
            <mat-option value="24/7">24/7 — Disponible siempre</mat-option>
            <mat-option value="Horario laboral">Horario laboral (Lun-Vie)</mat-option>
            <mat-option value="On-call">On-call — Solo incidentes críticos</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notas adicionales</mat-label>
          <mat-icon matPrefix>notes</mat-icon>
          <textarea matInput formControlName="notas" rows="2" placeholder="Ej. Contactar solo por incidentes P1/P2"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="padding: 16px 24px; gap: 8px;">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" style="background:#272257;" [disabled]="form.invalid" (click)="onSubmit()">
        <mat-icon>save</mat-icon>
        Guardar Contacto
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .w-full { width: 100%; }

    .nivel-section { background: #f8fafc; border-radius: 8px; padding: 14px 16px; margin-bottom: 4px; border: 1px solid #e2e8f0; }
    .nivel-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .nivel-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .nivel-group ::ng-deep .mat-radio-label { align-items: center; gap: 6px; }
    .nivel-chip { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; }
    .l1 { background: #3b82f6; }
    .l2 { background: #f59e0b; }
    .l3 { background: #ea580c; }
    .l4 { background: #dc2626; }
    .nivel-desc { font-size: 11px; color: #64748b; }
  `]
})
export class ContactoDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ContactoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      nombre: [data?.contacto?.nombre || '', Validators.required],
      cargo: [data?.contacto?.cargo || '', Validators.required],
      empresa: [data?.contacto?.empresa || ''],
      negocio: [data?.contacto?.negocio || ''],
      nivel: [data?.contacto?.nivel || 'L1', Validators.required],
      telefono: [data?.contacto?.telefono || '', Validators.required],
      correo: [data?.contacto?.correo || '', [Validators.required, Validators.email]],
      disponibilidad: [data?.contacto?.disponibilidad || '24/7'],
      notas: [data?.contacto?.notas || '']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

@Component({
  selector: 'app-escalamiento',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="escalamiento-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>account_tree</mat-icon>
          </div>
          <div>
            <h1 class="font-bebas">Matriz de Escalamiento</h1>
            <p class="header-subtitle">Directorio de contactos por nivel de respuesta a incidentes</p>
          </div>
        </div>
        <button mat-flat-button class="btn-add" (click)="openDialog()">
          <mat-icon>person_add</mat-icon>
          Agregar Contacto
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando matriz de escalamiento...</p>
      </div>

      <!-- Kanban columns -->
      <div class="kanban-board" *ngIf="!loading()">

        <!-- L1 -->
        <div class="kanban-col">
          <div class="col-header l1-header">
            <div class="col-title-row">
              <span class="level-badge l1-badge">L1</span>
              <h2 class="col-title font-bebas">Nivel 1</h2>
              <span class="col-count">{{ getContactsByLevel('L1').length }}</span>
            </div>
            <p class="col-desc">Soporte inicial y triaje</p>
          </div>
          <div class="col-body">
            <ng-container *ngTemplateOutlet="contactCard; context: { contacts: getContactsByLevel('L1'), level: 'L1' }"></ng-container>
          </div>
        </div>

        <!-- L2 -->
        <div class="kanban-col">
          <div class="col-header l2-header">
            <div class="col-title-row">
              <span class="level-badge l2-badge">L2</span>
              <h2 class="col-title font-bebas">Nivel 2</h2>
              <span class="col-count">{{ getContactsByLevel('L2').length }}</span>
            </div>
            <p class="col-desc">Análisis profundo e investigación</p>
          </div>
          <div class="col-body">
            <ng-container *ngTemplateOutlet="contactCard; context: { contacts: getContactsByLevel('L2'), level: 'L2' }"></ng-container>
          </div>
        </div>

        <!-- L3 -->
        <div class="kanban-col">
          <div class="col-header l3-header">
            <div class="col-title-row">
              <span class="level-badge l3-badge">L3</span>
              <h2 class="col-title font-bebas">Nivel 3</h2>
              <span class="col-count">{{ getContactsByLevel('L3').length }}</span>
            </div>
            <p class="col-desc">Especialistas y resolución compleja</p>
          </div>
          <div class="col-body">
            <ng-container *ngTemplateOutlet="contactCard; context: { contacts: getContactsByLevel('L3'), level: 'L3' }"></ng-container>
          </div>
        </div>

        <!-- L4 -->
        <div class="kanban-col">
          <div class="col-header l4-header">
            <div class="col-title-row">
              <span class="level-badge l4-badge">L4</span>
              <h2 class="col-title font-bebas">Nivel 4</h2>
              <span class="col-count">{{ getContactsByLevel('L4').length }}</span>
            </div>
            <p class="col-desc">Dirección, CISO y gestión de crisis</p>
          </div>
          <div class="col-body">
            <ng-container *ngTemplateOutlet="contactCard; context: { contacts: getContactsByLevel('L4'), level: 'L4' }"></ng-container>
          </div>
        </div>

      </div>
    </div>

    <!-- Contact card template -->
    <ng-template #contactCard let-contacts="contacts" let-level="level">
      <div *ngFor="let c of contacts" class="contact-card group">
        <div class="card-actions">
          <button mat-icon-button class="action-btn" color="primary" matTooltip="Editar" (click)="openDialog(c)">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button class="action-btn" color="warn" matTooltip="Eliminar" (click)="deleteContact(c.id)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>

        <!-- Avatar + nombre -->
        <div class="card-header-row">
          <div class="avatar" [class]="'avatar-' + (c.nivel | lowercase)">
            {{ getInitials(c.nombre) }}
          </div>
          <div class="card-name-info">
            <h3 class="contact-name">{{ c.nombre }}</h3>
            <p class="contact-cargo">{{ c.cargo }}</p>
          </div>
        </div>

        <!-- Empresa / Negocio -->
        <div class="company-row" *ngIf="c.empresa || c.negocio">
          <mat-icon class="info-icon">business</mat-icon>
          <span class="company-text">
            {{ c.empresa }}<span *ngIf="c.empresa && c.negocio"> · </span>{{ c.negocio }}
          </span>
        </div>

        <!-- Contacto -->
        <div class="contact-info-rows">
          <a [href]="'tel:' + c.telefono" class="contact-row">
            <mat-icon class="info-icon">phone</mat-icon>
            <span>{{ c.telefono }}</span>
          </a>
          <a [href]="'mailto:' + c.correo" class="contact-row" [title]="c.correo">
            <mat-icon class="info-icon">email</mat-icon>
            <span class="truncate">{{ c.correo }}</span>
          </a>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <span class="disp-badge"
                [class.disp-247]="c.disponibilidad === '24/7'"
                [class.disp-laboral]="c.disponibilidad === 'Horario laboral'"
                [class.disp-oncall]="c.disponibilidad === 'On-call'">
            <mat-icon style="font-size:12px; width:12px; height:12px; vertical-align:middle;">schedule</mat-icon>
            {{ c.disponibilidad }}
          </span>
          <mat-icon *ngIf="c.notas" class="notes-icon" [matTooltip]="c.notas">info</mat-icon>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="contacts.length === 0" class="empty-col">
        <mat-icon>person_off</mat-icon>
        <p>Sin contactos en este nivel</p>
        <button mat-stroked-button class="add-here-btn" (click)="openDialog(null, level)">
          + Agregar
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; }

    .escalamiento-container {
      padding: 24px;
      min-height: 100%;
      font-family: 'Montserrat', sans-serif;
      background: #f8fafc;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .header-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    h1.font-bebas { margin: 0; font-size: 28px; color: #272257; letter-spacing: 1px; }
    .header-subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .btn-add {
      background: #272257 !important;
      color: white !important;
      border-radius: 8px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
    }

    /* Loading */
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 16px; color: #64748b; }

    /* Kanban */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 1200px) {
      .kanban-board { grid-template-columns: repeat(2, 1fr); }
    }

    .kanban-col {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .col-header { padding: 16px 20px; }
    .l1-header { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-bottom: 3px solid #3b82f6; }
    .l2-header { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-bottom: 3px solid #f59e0b; }
    .l3-header { background: linear-gradient(135deg, #fff7ed, #ffedd5); border-bottom: 3px solid #ea580c; }
    .l4-header { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-bottom: 3px solid #dc2626; }

    .col-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .col-title { margin: 0; font-size: 20px; color: #1e293b; }
    .col-count {
      margin-left: auto;
      background: white;
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .col-desc { margin: 0; font-size: 11px; color: #64748b; }

    .level-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      color: white;
      font-family: 'Montserrat', sans-serif;
    }
    .l1-badge { background: #3b82f6; }
    .l2-badge { background: #f59e0b; }
    .l3-badge { background: #ea580c; }
    .l4-badge { background: #dc2626; }

    .col-body { padding: 12px; display: flex; flex-direction: column; gap: 12px; min-height: 200px; }

    /* Contact card */
    .contact-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      position: relative;
      transition: all 0.2s ease;
    }
    .contact-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border-color: #cbd5e1;
      transform: translateY(-2px);
    }

    .card-actions {
      position: absolute;
      top: 8px; right: 8px;
      display: none;
      gap: 2px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      padding: 2px;
    }
    .contact-card:hover .card-actions { display: flex; }
    .action-btn { width: 32px; height: 32px; line-height: 32px; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .card-header-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .avatar {
      width: 42px; height: 42px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; color: white;
      flex-shrink: 0;
    }
    .avatar-l1 { background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .avatar-l2 { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .avatar-l3 { background: linear-gradient(135deg, #c2410c, #ea580c); }
    .avatar-l4 { background: linear-gradient(135deg, #b91c1c, #dc2626); }

    .contact-name { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; line-height: 1.3; }
    .contact-cargo { margin: 2px 0 0; font-size: 11px; color: #64748b; }

    .company-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #475569;
      background: white; border-radius: 6px;
      padding: 5px 10px; margin-bottom: 10px;
      border: 1px solid #e2e8f0;
    }
    .company-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .contact-info-rows { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .contact-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #475569;
      text-decoration: none;
      transition: color 0.2s;
      overflow: hidden;
    }
    .contact-row:hover { color: #272257; }
    .contact-row .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .info-icon { font-size: 15px; width: 15px; height: 15px; flex-shrink: 0; color: #272257; }

    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 10px; border-top: 1px solid #e2e8f0;
    }
    .disp-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 600;
    }
    .disp-247 { background: #dcfce7; color: #166534; }
    .disp-laboral { background: #dbeafe; color: #1d4ed8; }
    .disp-oncall { background: #fef3c7; color: #92400e; }
    .notes-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; cursor: help; }

    /* Empty state */
    .empty-col {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 32px 16px; color: #94a3b8; text-align: center; gap: 8px;
      border: 2px dashed #e2e8f0; border-radius: 8px;
    }
    .empty-col mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: 0.5; }
    .empty-col p { margin: 0; font-size: 13px; }
    .add-here-btn { font-size: 12px; color: #272257 !important; border-color: #272257 !important; }
  `]
})
export class EscalamientoComponent implements OnInit {
  private escalamientoService = inject(EscalamientoService);
  private dialog = inject(MatDialog);

  contactos = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.loading.set(true);
    this.escalamientoService.getAll().subscribe({
      next: (data) => {
        this.contactos.set(Array.isArray(data) && data.length ? data : []);
        this.loading.set(false);
      },
      error: () => {
        this.contactos.set([]);
        this.loading.set(false);
      }
    });
  }

  getContactsByLevel(level: string) {
    return this.contactos().filter(c => c.nivel === level);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  openDialog(contacto?: any, defaultNivel?: string) {
    const dialogRef = this.dialog.open(ContactoDialogComponent, {
      width: '580px',
      maxHeight: '90vh',
      data: { contacto: contacto || (defaultNivel ? { nivel: defaultNivel } : null) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (contacto && contacto.id) {
          this.escalamientoService.update(contacto.id, result).subscribe({
            next: () => this.loadContacts(),
            error: () => {
              this.contactos.update(cs => cs.map(c => c.id === contacto.id ? { ...c, ...result } : c));
            }
          });
        } else {
          this.escalamientoService.create(result).subscribe({
            next: () => this.loadContacts(),
            error: () => {
              this.contactos.update(cs => [...cs, { ...result, id: Date.now().toString() }]);
            }
          });
        }
      }
    });
  }

  deleteContact(id: string) {
    if (confirm('¿Eliminar este contacto de escalamiento?')) {
      this.escalamientoService.delete(id).subscribe({
        next: () => this.loadContacts(),
        error: () => {
          this.contactos.update(cs => cs.filter(c => c.id !== id));
        }
      });
    }
  }
}
