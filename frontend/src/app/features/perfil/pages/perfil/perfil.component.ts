import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService, User } from '../../../../core/services/auth.service';
import { UsersService } from '../../../../core/services/users.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

/**
 * Componente de perfil de usuario.
 *
 * Permite al usuario autenticado:
 *  - Ver su información personal (nombre, cargo, correo, rol).
 *  - Actualizar su nombre, apellido y cargo mediante PATCH /users/:id/profile.
 *  - Cambiar su contraseña mediante POST /auth/change-password.
 *
 * Los campos de solo lectura (correo, rol, estado) no son editables
 * para mantener la integridad del control de acceso.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="perfil-page">

      <!-- ─── Hero Card ──────────────────────────────────────── -->
      <div class="hero-card">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="avatar-wrapper">
            <div class="avatar-circle">{{ getInitials() }}</div>
            <span class="avatar-status" [class.active]="user()?.isActive"></span>
          </div>
          <div class="hero-info">
            <h1 class="hero-name">{{ user()?.firstName }} {{ user()?.lastName }}</h1>
            <p class="hero-cargo">{{ user()?.cargo || 'Sin cargo asignado' }}</p>
            <div class="hero-meta">
              <span class="role-chip" [class]="'role-' + (user()?.role ?? 'viewer')">
                {{ getRoleLabel(user()?.role) }}
              </span>
              <span class="email-chip">
                <mat-icon class="chip-icon">email</mat-icon>
                {{ user()?.email }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Contenido Principal ────────────────────────────── -->
      <div class="content-grid">

        <!-- COLUMNA IZQUIERDA: Resumen de cuenta -->
        <div class="side-panel">

          <div class="info-card" id="resumen-cuenta">
            <div class="card-header">
              <div class="card-header-icon"><mat-icon>account_circle</mat-icon></div>
              <h2 class="card-title">Resumen de Cuenta</h2>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Usuario</span>
                <span class="info-value">&#64;{{ user()?.username }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Correo</span>
                <span class="info-value email-val">{{ user()?.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Rol</span>
                <span class="role-chip small" [class]="'role-' + (user()?.role ?? 'viewer')">
                  {{ getRoleLabel(user()?.role) }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Estado</span>
                <span class="status-indicator" [class.active]="user()?.isActive">
                  <span class="dot"></span>
                  {{ user()?.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>

          <div class="security-card">
            <div class="card-header">
              <div class="card-header-icon warning"><mat-icon>security</mat-icon></div>
              <h2 class="card-title">Seguridad</h2>
            </div>
            <p class="security-note">
              Cambia tu contraseña regularmente. Se recomienda una contraseña
              de al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos.
            </p>
            <a href="#cambiar-contrasena" class="security-link">
              <mat-icon>lock</mat-icon> Ir a cambiar contraseña
            </a>
          </div>

        </div>

        <!-- COLUMNA DERECHA: Formularios -->
        <div class="forms-panel">

          <!-- Información Personal -->
          <div class="form-card" id="informacion-personal">
            <div class="card-header">
              <div class="card-header-icon"><mat-icon>edit</mat-icon></div>
              <h2 class="card-title">Información Personal</h2>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="onProfileSubmit()" class="mri-form">
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">Nombre *</label>
                  <input class="form-input" formControlName="firstName" placeholder="Tu nombre" />
                  <span class="form-error" *ngIf="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched">
                    El nombre es requerido
                  </span>
                </div>
                <div class="form-group">
                  <label class="form-label">Apellido</label>
                  <input class="form-input" formControlName="lastName" placeholder="Tu apellido" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Cargo</label>
                <input class="form-input" formControlName="cargo" placeholder="Ej: Analista SOC" />
              </div>

              <div class="form-group readonly-group">
                <label class="form-label">Correo electrónico</label>
                <div class="readonly-field">
                  <mat-icon>lock</mat-icon>
                  <span>{{ user()?.email }}</span>
                </div>
                <p class="field-hint">El correo no es modificable. Contacta al administrador si necesitas cambiarlo.</p>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || profileForm.pristine || updatingProfile()">
                  <mat-spinner *ngIf="updatingProfile()" diameter="16" class="btn-spinner"></mat-spinner>
                  <mat-icon *ngIf="!updatingProfile()">save</mat-icon>
                  {{ updatingProfile() ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Cambiar Contraseña -->
          <div class="form-card" id="cambiar-contrasena">
            <div class="card-header">
              <div class="card-header-icon warning"><mat-icon>lock_reset</mat-icon></div>
              <h2 class="card-title">Cambiar Contraseña</h2>
            </div>
            <form [formGroup]="passwordForm" (ngSubmit)="onPasswordSubmit()" class="mri-form">

              <div class="form-group">
                <label class="form-label">Contraseña Actual *</label>
                <div class="input-with-icon">
                  <input
                    class="form-input"
                    [type]="showCurrent ? 'text' : 'password'"
                    formControlName="currentPassword"
                    placeholder="Tu contraseña actual"
                    autocomplete="current-password" />
                  <button type="button" class="eye-btn" (click)="showCurrent = !showCurrent">
                    <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                <span class="form-error" *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">
                  Requerido
                </span>
              </div>

              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">Nueva Contraseña *</label>
                  <div class="input-with-icon">
                    <input
                      class="form-input"
                      [type]="showNew ? 'text' : 'password'"
                      formControlName="newPassword"
                      placeholder="Mínimo 8 caracteres"
                      autocomplete="new-password" />
                    <button type="button" class="eye-btn" (click)="showNew = !showNew">
                      <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </div>
                  <span class="form-error" *ngIf="passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched">Requerido</span>
                  <span class="form-error" *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">Mínimo 8 caracteres</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Confirmar Contraseña *</label>
                  <div class="input-with-icon">
                    <input
                      class="form-input"
                      [type]="showConfirm ? 'text' : 'password'"
                      formControlName="confirmPassword"
                      placeholder="Repite la contraseña"
                      autocomplete="new-password" />
                    <button type="button" class="eye-btn" (click)="showConfirm = !showConfirm">
                      <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </div>
                  <span class="form-error" *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched">
                    Las contraseñas no coinciden
                  </span>
                </div>
              </div>

              <!-- Indicadores de fortaleza -->
              <div class="password-strength" *ngIf="newPasswordValue">
                <span [class.met]="newPasswordValue.length >= 8"><mat-icon>{{ newPasswordValue.length >= 8 ? 'check' : 'close' }}</mat-icon> 8+ caracteres</span>
                <span [class.met]="hasUppercase()"><mat-icon>{{ hasUppercase() ? 'check' : 'close' }}</mat-icon> Mayúscula</span>
                <span [class.met]="hasNumber()"><mat-icon>{{ hasNumber() ? 'check' : 'close' }}</mat-icon> Número</span>
                <span [class.met]="hasSymbol()"><mat-icon>{{ hasSymbol() ? 'check' : 'close' }}</mat-icon> Símbolo</span>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-warning" [disabled]="passwordForm.invalid || updatingPassword()">
                  <mat-spinner *ngIf="updatingPassword()" diameter="16" class="btn-spinner"></mat-spinner>
                  <mat-icon *ngIf="!updatingPassword()">lock_reset</mat-icon>
                  {{ updatingPassword() ? 'Actualizando...' : 'Actualizar Contraseña' }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Variables y layout ─────────────────────────────────── */
    .perfil-page {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
      font-family: 'Montserrat', sans-serif;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── Hero Card ──────────────────────────────────────────── */
    .hero-card {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(39,34,87,0.15);
    }
    .hero-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #272257 0%, #3b3a8c 50%, #5a45c8 100%);
    }
    .hero-content {
      position: relative;
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px 36px;
    }
    .avatar-wrapper { position: relative; flex-shrink: 0; }
    .avatar-circle {
      width: 88px; height: 88px;
      background: rgba(255,255,255,0.2);
      border: 3px solid rgba(255,255,255,0.5);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: 800; color: white;
      backdrop-filter: blur(4px);
    }
    .avatar-status {
      position: absolute; bottom: 4px; right: 4px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #94a3b8;
      border: 3px solid white;
    }
    .avatar-status.active { background: #22c55e; }

    .hero-info { color: white; }
    .hero-name {
      margin: 0 0 4px;
      font-size: 1.75rem; font-weight: 800;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
    }
    .hero-cargo { margin: 0 0 12px; opacity: 0.8; font-size: 14px; }
    .hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* ── Chips ──────────────────────────────────────────────── */
    .role-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 700;
      white-space: nowrap;
    }
    .role-chip.role-ADMIN   { background: rgba(255,255,255,0.25); color: white; }
    .role-chip.role-ANALISTA{ background: #dbeafe; color: #1d4ed8; }
    .role-chip.role-VIEWER  { background: #f1f5f9; color: #475569; }
    .role-chip.small { font-size: 11px; padding: 2px 10px; }

    .email-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 13px; color: rgba(255,255,255,0.85);
    }
    .chip-icon { font-size: 14px; width: 14px; height: 14px; }

    /* ── Grid principal ─────────────────────────────────────── */
    .content-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      align-items: start;
    }

    /* ── Cards genéricas ────────────────────────────────────── */
    .info-card, .security-card, .form-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.08);
    }
    .side-panel { display: flex; flex-direction: column; gap: 16px; }
    .forms-panel { display: flex; flex-direction: column; gap: 24px; }

    .card-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .card-header-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .card-header-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .card-header-icon.warning { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .card-title { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }

    /* ── Info list ──────────────────────────────────────────── */
    .info-list { display: flex; flex-direction: column; gap: 14px; }
    .info-row { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .info-value { font-size: 14px; color: #1e293b; font-weight: 500; word-break: break-all; }
    .email-val  { font-size: 12px; }

    /* ── Status indicator ───────────────────────────────────── */
    .status-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #94a3b8; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .status-indicator.active { color: #16a34a; }
    .status-indicator.active .dot { background: #16a34a; }

    /* ── Security card ──────────────────────────────────────── */
    .security-note { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 16px; }
    .security-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: #272257; font-size: 13px; font-weight: 600;
      text-decoration: none;
      padding: 8px 14px;
      background: #f0f0fa;
      border-radius: 8px;
      transition: background 0.15s;
    }
    .security-link:hover { background: #e0e0f5; }
    .security-link mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── Formularios ────────────────────────────────────────── */
    .mri-form { display: flex; flex-direction: column; gap: 18px; }
    .form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; }
    .form-input {
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      font-family: 'Montserrat', sans-serif;
      color: #1e293b;
      background: #fafbfc;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .form-input:focus {
      border-color: #272257;
      box-shadow: 0 0 0 3px rgba(39,34,87,0.1);
      background: white;
    }
    .form-error { font-size: 12px; color: #dc2626; }

    .readonly-group { margin-top: 4px; }
    .readonly-field {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px; color: #64748b;
    }
    .readonly-field mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .field-hint { margin: 4px 0 0; font-size: 11px; color: #94a3b8; }

    /* ── Input con icono ojo ────────────────────────────────── */
    .input-with-icon { position: relative; }
    .input-with-icon .form-input { width: 100%; box-sizing: border-box; padding-right: 44px; }
    .eye-btn {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0;
      display: flex; align-items: center;
    }
    .eye-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Indicadores de contraseña ──────────────────────────── */
    .password-strength {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 12px; background: #f8fafc; border-radius: 8px;
    }
    .password-strength span {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; color: #94a3b8;
      border: 1px solid #e2e8f0; border-radius: 20px; padding: 2px 8px;
    }
    .password-strength span mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .password-strength span.met { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }

    /* ── Botones ────────────────────────────────────────────── */
    .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }
    .btn-primary, .btn-warning {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px; border-radius: 8px;
      border: none; cursor: pointer;
      font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 14px;
      transition: opacity 0.15s, box-shadow 0.15s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #272257, #3b3a8c);
      color: white;
      box-shadow: 0 4px 12px rgba(39,34,87,0.3);
    }
    .btn-warning {
      background: linear-gradient(135deg, #d97706, #f59e0b);
      color: white;
      box-shadow: 0 4px 12px rgba(217,119,6,0.3);
    }
    .btn-primary:disabled, .btn-warning:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
    .btn-primary:hover:not(:disabled), .btn-warning:hover:not(:disabled) { opacity: 0.9; }
    .btn-spinner { display: inline-block; }
    .btn-primary mat-icon, .btn-warning mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 900px) {
      .content-grid { grid-template-columns: 1fr; }
      .form-row.two-col { grid-template-columns: 1fr; }
      .hero-content { flex-direction: column; text-align: center; }
      .hero-meta { justify-content: center; }
    }
  `]
})
export class PerfilComponent implements OnInit {
  private authService   = inject(AuthService);
  private usersService  = inject(UsersService);
  private toastr        = inject(ToastrService);
  private fb            = inject(FormBuilder);

  /** Usuario reactivo cargado desde el estado de autenticación. */
  user = signal<User | null>(null);

  /** Estados de carga para los formularios. */
  updatingProfile  = signal(false);
  updatingPassword = signal(false);

  /** Controles de visibilidad de contraseñas. */
  showCurrent = false;
  showNew     = false;
  showConfirm = false;

  /** Formulario de información personal. */
  profileForm: FormGroup;

  /** Formulario de cambio de contraseña. */
  passwordForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  [''],
      cargo:     [''],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword:     ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadUserFromSession();
  }

  /**
   * Carga los datos del usuario desde el estado de autenticación.
   * Utiliza el signal reactivo de AuthService para sincronizar automáticamente
   * si el token se refresca o el perfil se actualiza en otro contexto.
   */
  loadUserFromSession(): void {
    const current = this.authService.user();
    if (current) {
      this.user.set(current);
      this.profileForm.patchValue({
        firstName: current.firstName ?? '',
        lastName:  current.lastName  ?? '',
        cargo:     current.cargo     ?? '',
      });
    }
  }

  /**
   * Retorna las iniciales del usuario para el avatar.
   */
  getInitials(): string {
    const u = this.user();
    if (!u) return 'U';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || 'U';
  }

  /**
   * Traduce el rol técnico a etiqueta visual con emoji.
   */
  getRoleLabel(role?: string): string {
    const map: Record<string, string> = {
      ADMIN:    '👑 MRI',
      ANALISTA: '🔎 Analista',
      VIEWER:   '👁️ Viewer',
    };
    return map[role ?? ''] ?? role ?? '';
  }

  /** Valor actual del campo nueva contraseña para los indicadores de fortaleza. */
  get newPasswordValue(): string {
    return this.passwordForm.get('newPassword')?.value ?? '';
  }

  /** Verifica si la nueva contraseña contiene al menos una mayúscula. */
  hasUppercase(): boolean { return /[A-Z]/.test(this.newPasswordValue); }

  /** Verifica si la nueva contraseña contiene al menos un número. */
  hasNumber(): boolean { return /[0-9]/.test(this.newPasswordValue); }

  /** Verifica si la nueva contraseña contiene al menos un símbolo especial. */
  hasSymbol(): boolean { return /[^A-Za-z0-9]/.test(this.newPasswordValue); }

  /**
   * Valida que nueva contraseña y confirmación sean idénticas.
   */
  private passwordMatchValidator(g: FormGroup) {
    const np = g.get('newPassword')?.value;
    const cp = g.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  /**
   * Envía los cambios del perfil personal al backend.
   * Endpoint: PATCH /api/v1/users/:id/profile
   */
  onProfileSubmit(): void {
    if (this.profileForm.invalid) return;
    const userId = this.user()?.id;
    if (!userId) return;

    this.updatingProfile.set(true);
    const { firstName, lastName, cargo } = this.profileForm.value;

    this.usersService.updateProfile(userId, { firstName, lastName, cargo }).subscribe({
      next: (updated: any) => {
        // Actualizar estado local y sesión persistida
        this.authService.updateUserState({ firstName, lastName, cargo });
        this.user.update(u => u ? { ...u, firstName, lastName, cargo } : u);
        this.profileForm.markAsPristine();
        this.toastr.success('Perfil actualizado correctamente', '¡Listo!');
        this.updatingProfile.set(false);
      },
      error: () => {
        this.toastr.error('No se pudo actualizar el perfil. Intente de nuevo.', 'Error');
        this.updatingProfile.set(false);
      },
    });
  }

  /**
   * Envía el cambio de contraseña al backend.
   * Endpoint: POST /api/v1/auth/change-password
   */
  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) return;
    this.updatingPassword.set(true);

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: () => {
        this.toastr.success('Contraseña actualizada correctamente', '¡Listo!');
        this.passwordForm.reset();
        this.showCurrent = false;
        this.showNew     = false;
        this.showConfirm = false;
        this.updatingPassword.set(false);
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? 'No se pudo actualizar la contraseña';
        this.toastr.error(msg, 'Error');
        this.updatingPassword.set(false);
      },
    });
  }
}
