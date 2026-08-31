import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsersService } from '../../../../core/services/users.service';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ─── Password strength validator ──────────────────────────────────
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value || '';
  if (!v) return null;
  const errors: string[] = [];
  if (v.length < 8) errors.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(v)) errors.push('al menos 1 mayúscula');
  if (!/[a-z]/.test(v)) errors.push('al menos 1 minúscula');
  if (!/[0-9]/.test(v)) errors.push('al menos 1 número');
  if (!/[^A-Za-z0-9]/.test(v)) errors.push('al menos 1 símbolo (!@#$...)');
  return errors.length ? { weakness: errors.join(', ') } : null;
}

// ─── Confirm Delete Dialog ────────────────────────────────────────
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <h2 mat-dialog-title class="confirm-title">¿Eliminar Usuario?</h2>
      <mat-dialog-content>
        <p class="confirm-text">
          ¿Estás seguro de que deseas <strong>desactivar permanentemente</strong> al usuario
          <span class="user-highlight">{{ data?.username }}</span>?
        </p>
        <p class="confirm-warning">Esta acción desactivará el acceso del usuario al sistema.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="confirm-actions">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button mat-flat-button class="btn-delete" (click)="confirm()">
          <mat-icon>delete</mat-icon>
          Sí, desactivar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding: 8px; text-align: center; min-width: 360px; font-family: 'Montserrat', sans-serif; }
    .confirm-icon { margin: 16px auto 8px; width: 64px; height: 64px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center; }
    .confirm-icon mat-icon { font-size: 32px; width: 32px; height: 32px; color: #d97706; }
    .confirm-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; color: #1e293b; margin: 0; }
    .confirm-text { color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 8px; }
    .user-highlight { font-weight: 700; color: #272257; }
    .confirm-warning { font-size: 12px; color: #dc2626; background: #fee2e2; padding: 8px 12px; border-radius: 6px; margin: 0; }
    .confirm-actions { gap: 8px; padding: 16px 24px !important; }
    .btn-delete { background: #dc2626 !important; color: white !important; font-family: 'Montserrat', sans-serif; font-weight: 600; }
  `]
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  confirm() { this.dialogRef.close(true); }
}

// ─── User Dialog Component ────────────────────────────────────────
@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatDialogModule, MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <div class="dialog-header-icon">
        <mat-icon>{{ data?.user ? 'manage_accounts' : 'person_add' }}</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title class="dialog-title font-bebas">
          {{ data?.user ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
        </h2>
        <p class="dialog-subtitle" *ngIf="!data?.user">
          El usuario iniciará sesión con su <strong>correo electrónico</strong> y deberá cambiar su contraseña al primer acceso.
        </p>
      </div>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="user-form">

        <!-- ──── MODO CREACIÓN ──── -->
        <ng-container *ngIf="!data?.user">

          <!-- Nombre y Apellido -->
          <div class="form-row-2">
            <mat-form-field appearance="outline">
              <mat-label>Nombre *</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="firstName" placeholder="Ej. Walter" autocomplete="off">
              <mat-error>El nombre es requerido</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Apellido</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="lastName" placeholder="Ej. Reyes" autocomplete="off">
            </mat-form-field>
          </div>

          <!-- Cargo -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Cargo / Puesto</mat-label>
            <mat-icon matPrefix>work</mat-icon>
            <input matInput formControlName="cargo" placeholder="Ej. Analista SOC L1" autocomplete="off">
          </mat-form-field>

          <!-- Email -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Correo electrónico *</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="email" placeholder="usuario@femsasalud.com" autocomplete="off" (input)="updateUsernamePreview()">
            <mat-error *ngIf="form.get('email')?.errors?.['required']">El correo es requerido</mat-error>
            <mat-error *ngIf="form.get('email')?.errors?.['email']">Correo inválido</mat-error>
            <mat-hint *ngIf="usernamePreview" class="username-hint">
              🔑 Inicio de sesión con: <strong>{{ form.get('email')?.value }}</strong>
              &nbsp;&bull;&nbsp; Usuario interno: <code>{{ usernamePreview }}</code>
            </mat-hint>
          </mat-form-field>

          <!-- Rol -->
          <div class="role-selector-label">
            <mat-icon>shield</mat-icon>
            <span>Rol y permisos en el sistema *</span>
          </div>
          <div class="role-cards">
            <div class="role-card" [class.selected]="form.get('role')?.value === 'ANALISTA'" (click)="form.get('role')?.setValue('ANALISTA')">
              <div class="role-card-header analista-header">
                <span class="role-card-icon">🔎</span>
                <strong>ANALISTA</strong>
                <span class="role-card-check" *ngIf="form.get('role')?.value === 'ANALISTA'">✓</span>
              </div>
              <ul class="role-card-perms">
                <li class="can">✅ Ver todos los eventos e incidentes</li>
                <li class="can">✅ Crear nuevos eventos e incidentes</li>
                <li class="can">✅ Editar eventos e incidentes</li>
                <li class="can">✅ Descargar reportes y PDFs</li>
                <li class="cannot">❌ Eliminar registros</li>
                <li class="cannot">❌ Gestionar usuarios</li>
              </ul>
            </div>
            <div class="role-card" [class.selected]="form.get('role')?.value === 'VIEWER'" (click)="form.get('role')?.setValue('VIEWER')">
              <div class="role-card-header viewer-header">
                <span class="role-card-icon">👁️</span>
                <strong>SOLO LECTURA</strong>
                <span class="role-card-check" *ngIf="form.get('role')?.value === 'VIEWER'">✓</span>
              </div>
              <ul class="role-card-perms">
                <li class="can">✅ Ver todos los eventos e incidentes</li>
                <li class="can">✅ Descargar reportes y PDFs</li>
                <li class="cannot">❌ Crear registros</li>
                <li class="cannot">❌ Editar registros</li>
                <li class="cannot">❌ Eliminar registros</li>
                <li class="cannot">❌ Gestionar usuarios</li>
              </ul>
            </div>
            <div class="role-card" [class.selected]="form.get('role')?.value === 'ADMIN'" (click)="form.get('role')?.setValue('ADMIN')">
              <div class="role-card-header admin-header">
                <span class="role-card-icon">👑</span>
                <strong>MRI</strong>
                <span class="role-card-check" *ngIf="form.get('role')?.value === 'ADMIN'">✓</span>
              </div>
              <ul class="role-card-perms">
                <li class="can">✅ Acceso total al sistema</li>
                <li class="can">✅ Crear, editar y eliminar todo</li>
                <li class="can">✅ Crear y gestionar usuarios</li>
                <li class="can">✅ Descargar reportes y PDFs</li>
              </ul>
            </div>
          </div>

          <!-- Contraseña temporal -->
          <div class="password-section">
            <div class="password-section-title">
              <mat-icon>lock</mat-icon>
              <span>Contraseña Temporal</span>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Contraseña temporal *</mat-label>
              <mat-icon matPrefix>key</mat-icon>
              <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password"
                     placeholder="Mín. 8 chars, mayúscula, minúscula, número, símbolo" autocomplete="new-password">
              <button type="button" mat-icon-button matSuffix (click)="showPassword = !showPassword">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.errors?.['required']">Requerido</mat-error>
              <mat-error *ngIf="form.get('password')?.errors?.['weakness']">
                Faltan: {{ form.get('password')?.errors?.['weakness'] }}
              </mat-error>
            </mat-form-field>

            <!-- Indicadores de políticas -->
            <div class="policy-indicators">
              <span [class.met]="hasMinLength()">
                <mat-icon>{{ hasMinLength() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                8+ caracteres
              </span>
              <span [class.met]="hasUppercase()">
                <mat-icon>{{ hasUppercase() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Mayúscula
              </span>
              <span [class.met]="hasLowercase()">
                <mat-icon>{{ hasLowercase() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Minúscula
              </span>
              <span [class.met]="hasNumber()">
                <mat-icon>{{ hasNumber() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Número
              </span>
              <span [class.met]="hasSymbol()">
                <mat-icon>{{ hasSymbol() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Símbolo
              </span>
            </div>

            <div class="first-login-notice">
              <mat-icon>info</mat-icon>
              <span>Al iniciar sesión por <strong>primera vez</strong>, el sistema le exigirá automáticamente crear una nueva contraseña personal.</span>
            </div>
          </div>
        </ng-container>

        <!-- ──── MODO EDICIÓN ──── -->
        <ng-container *ngIf="data?.user">

          <!-- Nombre y Apellido -->
          <div class="form-row-2">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="firstName" placeholder="Ej. Walter">
              <mat-error>Requerido</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Apellido</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="lastName" placeholder="Ej. Reyes">
            </mat-form-field>
          </div>

          <!-- Email -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Correo electrónico</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="email" placeholder="usuario@empresa.com">
            <mat-error>Correo inválido</mat-error>
          </mat-form-field>

          <!-- Cargo -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Cargo</mat-label>
            <mat-icon matPrefix>work</mat-icon>
            <input matInput formControlName="cargo" placeholder="Ej. Analista SOC L1">
          </mat-form-field>

          <!-- Rol -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Rol en el sistema *</mat-label>
            <mat-icon matPrefix>shield</mat-icon>
            <mat-select formControlName="role">
              <mat-option value="ADMIN">
                <span class="role-option admin">👑 MRI</span>
              </mat-option>
              <mat-option value="ANALISTA">
                <span class="role-option analista">🔎 ANALISTA</span>
              </mat-option>
              <mat-option value="VIEWER">
                <span class="role-option viewer">👁️ SOLO LECTURA</span>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Estado activo -->
          <div class="toggle-row">
            <mat-slide-toggle formControlName="isActive" color="primary">
              Usuario activo en el sistema
            </mat-slide-toggle>
          </div>

          <!-- Forzar cambio de contraseña -->
          <div class="toggle-row">
            <mat-slide-toggle formControlName="mustChangePassword" color="warn">
              Forzar cambio de contraseña en próximo ingreso
            </mat-slide-toggle>
          </div>
        </ng-container>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button class="btn-save" [disabled]="form.invalid" (click)="onSubmit()">
        <mat-icon>save</mat-icon>
        {{ data?.user ? 'Guardar Cambios' : 'Crear Usuario' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; }
    .dialog-header {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 24px 8px; border-bottom: 1px solid #e2e8f0;
    }
    .dialog-header-icon {
      width: 52px; height: 52px; border-radius: 12px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .dialog-title { margin: 0; font-size: 1.6rem; color: #272257; letter-spacing: 1px; }
    ::ng-deep .mat-mdc-dialog-title { padding: 0 !important; }
    .dialog-subtitle { margin: 4px 0 0; font-size: 12px; color: #64748b; font-family: 'Montserrat', sans-serif; }
    .dialog-content { padding: 20px 24px !important; min-width: 480px; }
    .dialog-actions { padding: 12px 24px !important; gap: 8px; }

    .user-form { display: flex; flex-direction: column; gap: 8px; font-family: 'Montserrat', sans-serif; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-form-field { width: 100%; }
    .w-full { width: 100%; }
    .role-option { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; }

    /* Role cards selector */
    .role-selector-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: #272257;
      margin-bottom: 6px;
    }
    .role-selector-label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .role-cards { display: flex; flex-direction: column; gap: 10px; }
    .role-card {
      border: 2px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;
      cursor: pointer; transition: all 0.2s; background: #f8fafc;
    }
    .role-card:hover { border-color: #94a3b8; background: #f1f5f9; }
    .role-card.selected { border-color: #272257; background: #f5f3ff; }
    .role-card-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; margin-bottom: 8px;
    }
    .role-card-icon { font-size: 18px; }
    .role-card-check { margin-left: auto; color: #272257; font-weight: 700; }
    .admin-header strong { color: #272257; }
    .analista-header strong { color: #1d4ed8; }
    .viewer-header strong { color: #475569; }
    .role-card-perms {
      margin: 0; padding-left: 0; list-style: none;
      display: flex; flex-direction: column; gap: 3px;
    }
    .role-card-perms li {
      font-size: 11px; font-family: 'Montserrat', sans-serif;
    }
    .role-card-perms li.can { color: #15803d; }
    .role-card-perms li.cannot { color: #94a3b8; }

    .password-section {
      background: #f8fafc; border-radius: 10px; padding: 16px;
      border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;
    }
    .password-section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: #272257;
    }

    .policy-indicators {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .policy-indicators span {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: #94a3b8; padding: 4px 8px;
      background: white; border-radius: 20px; border: 1px solid #e2e8f0;
      transition: all 0.2s; font-family: 'Montserrat', sans-serif;
    }
    .policy-indicators span mat-icon { font-size: 13px; width: 13px; height: 13px; color: #cbd5e1; }
    .policy-indicators span.met { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
    .policy-indicators span.met mat-icon { color: #16a34a; }

    .first-login-notice {
      display: flex; align-items: flex-start; gap: 8px;
      background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 8px; padding: 10px 12px;
      font-size: 12px; color: #1d4ed8; line-height: 1.5;
    }
    .first-login-notice mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    .toggle-row { padding: 6px 0; }

    .username-hint { font-size: 11px !important; color: #4f46e5 !important; }
    .username-hint code { background: #ede9fe; padding: 1px 5px; border-radius: 4px; font-size: 11px; }

    .btn-save { background: #272257 !important; color: white !important; font-family: 'Montserrat', sans-serif; font-weight: 600; }
  `]
})
export class UserDialogComponent {
  form: FormGroup;
  showPassword = false;
  usernamePreview = '';

  updateUsernamePreview() {
    const email: string = this.form.get('email')?.value || '';
    if (email.includes('@')) {
      this.usernamePreview = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    } else {
      this.usernamePreview = '';
    }
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.user) {
      // Modo edición
      this.form = this.fb.group({
        firstName: [data.user.firstName || '', Validators.required],
        lastName: [data.user.lastName || ''],
        email: [data.user.email || '', [Validators.required, Validators.email]],
        cargo: [data.user.cargo || ''],
        role: [data.user.role || 'VIEWER', Validators.required],
        isActive: [data.user.isActive !== false],
        mustChangePassword: [data.user.mustChangePassword || false],
      });
    } else {
      // Modo creación — nombre, apellido, cargo, email, rol, contraseña
      this.form = this.fb.group({
        firstName: ['', Validators.required],
        lastName: [''],
        cargo: [''],
        email: ['', [Validators.required, Validators.email]],
        role: ['ANALISTA', Validators.required],
        password: ['', [Validators.required, passwordStrengthValidator]],
      });
    }
  }

  get passwordValue(): string {
    return this.form.get('password')?.value || '';
  }

  hasMinLength(): boolean { return this.passwordValue.length >= 8; }
  hasUppercase(): boolean { return /[A-Z]/.test(this.passwordValue); }
  hasLowercase(): boolean { return /[a-z]/.test(this.passwordValue); }
  hasNumber(): boolean { return /[0-9]/.test(this.passwordValue); }
  hasSymbol(): boolean { return /[^A-Za-z0-9]/.test(this.passwordValue); }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

// ─── Admin Component ───────────────────────────────────────────────
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="admin-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>admin_panel_settings</mat-icon>
          </div>
          <div>
            <h1 class="font-bebas">Administración de Usuarios</h1>
            <p class="header-subtitle">Solo los <strong>Usuarios MRI</strong> pueden crear, editar y eliminar cuentas de acceso</p>
          </div>
        </div>
        <button mat-flat-button class="btn-new-user" (click)="openDialog()" id="btn-crear-usuario">
          <mat-icon>person_add</mat-icon>
          Crear Usuario
        </button>
      </div>

      <!-- Role legend -->
      <div class="role-legend">
        <div class="legend-item">
          <span class="role-badge role-admin">👑 MRI</span>
          <span class="legend-desc">Crear, editar y eliminar todo</span>
        </div>
        <div class="legend-item">
          <span class="role-badge role-analista">🔎 ANALISTA</span>
          <span class="legend-desc">Ver y editar incidentes/eventos</span>
        </div>
        <div class="legend-item">
          <span class="role-badge role-viewer">👁️ VIEWER</span>
          <span class="legend-desc">Solo lectura, sin modificar</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total-icon"><mat-icon>group</mat-icon></div>
          <div>
            <p class="stat-label">Total Usuarios</p>
            <h2 class="stat-value">{{ totalUsers() }}</h2>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active-icon"><mat-icon>check_circle</mat-icon></div>
          <div>
            <p class="stat-label">Activos</p>
            <h2 class="stat-value">{{ activeUsers() }}</h2>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon admin-icon"><mat-icon>shield</mat-icon></div>
          <div>
            <p class="stat-label">Usuarios MRI</p>
            <h2 class="stat-value">{{ adminUsers() }}</h2>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon analista-icon"><mat-icon>engineering</mat-icon></div>
          <div>
            <p class="stat-label">Analistas</p>
            <h2 class="stat-value">{{ analistaUsers() }}</h2>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando usuarios...</p>
      </div>

      <!-- Access Denied -->
      <div *ngIf="!loading() && accessDenied()" class="access-denied-banner">
        <mat-icon>lock</mat-icon>
        <div>
          <strong>Acceso restringido</strong>
          <p>Solo los <strong>Usuarios MRI</strong> pueden gestionar usuarios. Contacta al administrador del sistema para obtener acceso.</p>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper" *ngIf="!loading() && !accessDenied()">
        <table mat-table [dataSource]="users()" class="users-table">

          <ng-container matColumnDef="avatar">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <div class="user-avatar" [class.inactive]="!row.isActive">
                {{ getInitials(row) }}
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let row">
              <div class="user-name-cell">
                <span class="user-fullname">{{ getDisplayName(row) }}</span>
                <span class="user-username">&#64;{{ row.username }}</span>
                <span *ngIf="row.mustChangePassword" class="must-change-badge" matTooltip="Pendiente cambio de contraseña al primer inicio de sesión">
                  <mat-icon>lock_clock</mat-icon> Primer acceso pendiente
                </span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Correo</th>
            <td mat-cell *matCellDef="let row" class="cell-muted">{{ row.email }}</td>
          </ng-container>

          <ng-container matColumnDef="cargo">
            <th mat-header-cell *matHeaderCellDef>Cargo</th>
            <td mat-cell *matCellDef="let row" class="cell-muted">{{ row.cargo }}</td>
          </ng-container>

          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let row">
              <span class="role-badge"
                    [class.role-admin]="row.role === 'ADMIN'"
                    [class.role-analista]="row.role === 'ANALISTA'"
                    [class.role-viewer]="row.role === 'VIEWER'">
                {{ getRoleLabel(row.role) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let row">
              <span class="estado-indicator" [class.active]="row.isActive">
                <span class="dot"></span>
                {{ row.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-right">Acciones</th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <button mat-icon-button color="primary" matTooltip="Editar usuario" (click)="openDialog(row)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="accent" matTooltip="Forzar cambio de contraseña" (click)="forcePasswordChange(row)">
                <mat-icon>lock_reset</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Desactivar usuario"
                      (click)="confirmDeactivate(row)" [disabled]="!row.isActive">
                <mat-icon>{{ row.isActive ? 'person_remove' : 'block' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="user-row"
              [class.inactive-row]="!row.isActive"></tr>
        </table>

        <!-- Empty state -->
        <div *ngIf="users().length === 0" class="table-empty">
          <mat-icon>group_off</mat-icon>
          <p>No hay usuarios registrados. Crea el primero con el botón "Crear Usuario".</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; }

    .admin-page {
      padding: 24px;
      min-height: 100%;
      font-family: 'Montserrat', sans-serif;
      background: #f8fafc;
    }

    /* Header */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      background: white; padding: 20px 24px; border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 52px; height: 52px; border-radius: 12px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .header-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    h1.font-bebas { margin: 0; font-size: 28px; color: #272257; letter-spacing: 1px; }
    .header-subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .btn-new-user {
      background: linear-gradient(135deg, #272257, #3b3a8c) !important;
      color: white !important;
      border-radius: 8px; font-family: 'Montserrat', sans-serif; font-weight: 600;
      box-shadow: 0 4px 12px rgba(39,34,87,0.3);
    }

    /* Role legend */
    .role-legend {
      display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;
      background: white; padding: 12px 20px; border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .legend-item { display: flex; align-items: center; gap: 10px; }
    .legend-desc { font-size: 12px; color: #64748b; }

    /* Stats */
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;
    }
    .stat-card {
      background: white; border-radius: 10px; padding: 16px 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .total-icon { background: #eff6ff; color: #2563eb; }
    .active-icon { background: #dcfce7; color: #16a34a; }
    .admin-icon { background: #f5f3ff; color: #272257; }
    .analista-icon { background: #fff7ed; color: #ea580c; }
    .stat-label { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { margin: 4px 0 0; font-size: 26px; font-weight: 800; color: #1e293b; font-family: 'Montserrat', sans-serif; }

    /* Loading */
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 16px; color: #64748b; }

    /* Access denied banner */
    .access-denied-banner {
      display: flex; align-items: flex-start; gap: 20px;
      background: #fff7ed; border: 1px solid #fed7aa;
      border-radius: 12px; padding: 24px 28px; margin: 8px 0;
    }
    .access-denied-banner mat-icon { font-size: 36px; width: 36px; height: 36px; color: #ea580c; flex-shrink: 0; margin-top: 4px; }
    .access-denied-banner strong { font-size: 16px; color: #9a3412; display: block; margin-bottom: 6px; }
    .access-denied-banner p { margin: 0; color: #78350f; font-size: 14px; line-height: 1.6; }

    /* Table */
    .table-wrapper { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .users-table { width: 100%; }

    ::ng-deep .users-table .mat-mdc-header-cell {
      font-family: 'Montserrat', sans-serif; font-weight: 700; color: #475569;
      font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px;
    }
    .user-avatar.inactive { background: #94a3b8; }

    .user-name-cell { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
    .user-fullname { font-weight: 600; color: #1e293b; font-size: 14px; }
    .user-username { font-size: 12px; color: #94a3b8; }
    .must-change-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #fef3c7; color: #92400e;
      padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 2px;
    }
    .must-change-badge mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .cell-muted { font-size: 13px; color: #64748b; }
    .text-right { text-align: right !important; }

    .role-badge {
      padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
      white-space: nowrap; display: inline-block;
    }
    .role-admin    { background: #272257; color: white; }
    .role-analista { background: #dbeafe; color: #1d4ed8; }
    .role-viewer   { background: #f1f5f9; color: #475569; }

    .estado-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .estado-indicator.active { color: #16a34a; }
    .estado-indicator.active .dot { background: #16a34a; }

    .user-row { transition: background 0.15s; }
    .user-row:hover { background: #f8fafc; }
    .inactive-row { opacity: 0.55; }

    .table-empty { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 12px; color: #94a3b8; }
    .table-empty mat-icon { font-size: 48px; width: 48px; height: 48px; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .role-legend { flex-direction: column; gap: 8px; }
    }
  `]
})
export class AdminComponent implements OnInit {
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<any[]>([]);
  loading = signal<boolean>(true);
  displayedColumns = ['avatar', 'nombre', 'email', 'cargo', 'rol', 'estado', 'acciones'];

  totalUsers = signal(0);
  activeUsers = signal(0);
  adminUsers = signal(0);
  analistaUsers = signal(0);

  ngOnInit() {
    this.loadUsers();
  }

  accessDenied = signal(false);

  loadUsers() {
    this.loading.set(true);
    this.accessDenied.set(false);
    this.usersService.getAll().subscribe({
      next: (data: any[]) => {
        this.setUsersAndStats(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 403) {
          // Sin permisos — mostrar mensaje sin cerrar sesión
          this.accessDenied.set(true);
          this.setUsersAndStats([]);
        } else {
          this.setUsersAndStats([]);
        }
      }
    });
  }

  setUsersAndStats(data: any[]) {
    this.users.set(data);
    this.totalUsers.set(data.length);
    this.activeUsers.set(data.filter(u => u.isActive).length);
    this.adminUsers.set(data.filter(u => u.role === 'ADMIN').length);
    this.analistaUsers.set(data.filter(u => u.role === 'ANALISTA').length);
  }

  getInitials(user: any): string {
    const fn = user.firstName || user.username || '?';
    const ln = user.lastName || '';
    return (fn[0] || '?').toUpperCase() + (ln[0] || '').toUpperCase();
  }

  getDisplayName(user: any): string {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.username || user.email || 'Sin nombre';
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return '👑 MRI';
      case 'ANALISTA': return '🔎 Analista';
      case 'VIEWER': return '👁️ Viewer';
      default: return role || '—';
    }
  }

  openDialog(user?: any) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '560px',
      maxHeight: '92vh',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (user) {
        // Editar usuario
        const updateData: any = {
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          cargo: result.cargo,
          role: result.role,
          isActive: result.isActive,
          mustChangePassword: result.mustChangePassword,
        };

        this.usersService.update(user.id, updateData).subscribe({
          next: () => {
            this.snackBar.open('✅ Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => {
            const msg = err?.error?.message || 'Error al actualizar el usuario';
            this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4000 });
          }
        });
      } else {
        // Crear usuario — todos los campos
        const createData = {
          firstName: result.firstName,
          lastName: result.lastName,
          cargo: result.cargo || '',
          email: result.email,
          role: result.role,
          password: result.password,
        };

        this.usersService.create(createData).subscribe({
          next: (newUser: any) => {
            this.snackBar.open(
              `✅ Usuario "${newUser.username || result.email}" creado. Deberá cambiar su contraseña al primer ingreso.`,
              'Cerrar', { duration: 5000 }
            );
            this.loadUsers();
          },
          error: (err) => {
            const msg = err?.error?.message || 'Error al crear el usuario';
            this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  forcePasswordChange(user: any) {
    if (confirm(`¿Forzar cambio de contraseña para "${user.username}" en su próximo inicio de sesión?`)) {
      this.usersService.update(user.id, { mustChangePassword: true }).subscribe({
        next: () => {
          this.snackBar.open('🔐 El usuario deberá cambiar su contraseña al próximo inicio de sesión', 'Cerrar', { duration: 4000 });
          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('❌ Error al actualizar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  confirmDeactivate(user: any) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '420px',
      data: { username: user.username || user.email }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.usersService.deactivate(user.id).subscribe({
          next: () => {
            this.snackBar.open(`🚫 Usuario "${user.username}" desactivado`, 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: () => {
            this.snackBar.open('❌ Error al desactivar el usuario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }
}
