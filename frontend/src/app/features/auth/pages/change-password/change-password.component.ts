import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value || '';
  if (!v) return null;
  const errors: string[] = [];
  if (v.length < 8) errors.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(v)) errors.push('al menos 1 mayúscula');
  if (!/[0-9]/.test(v)) errors.push('al menos 1 número');
  if (!/[^A-Za-z0-9]/.test(v)) errors.push('al menos 1 símbolo');
  return errors.length ? { weakness: errors.join(', ') } : null;
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPass = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPass && confirm && newPass !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="change-password-container">
      <!-- Left panel -->
      <div class="left-panel">
        <div class="brand-content">
          <img src="assets/logo-icon.png" alt="Logo FEMSA" class="spin-logo">
          <h1 class="brand-title">REGISTRO MRI</h1>
          <p class="brand-subtitle">FEMSA Salud</p>
        </div>
        <div class="security-notice">
          <div class="notice-icon"><mat-icon>security</mat-icon></div>
          <p>Por tu seguridad, debes establecer una contraseña personal antes de continuar.</p>
        </div>
      </div>

      <!-- Right panel -->
      <div class="right-panel">
        <div class="form-container">
          <div class="form-header">
            <div class="lock-icon">
              <mat-icon>lock_reset</mat-icon>
            </div>
            <h2 class="form-title font-bebas">Establecer Nueva Contraseña</h2>
            <p class="form-subtitle">
              Esta es tu primera sesión. Por seguridad, debes crear una nueva contraseña personal.
            </p>
          </div>

          <!-- Password requirements -->
          <div class="requirements-box">
            <p class="req-title"><mat-icon>checklist</mat-icon> La contraseña debe tener:</p>
            <div class="req-list">
              <span [class.req-met]="hasMinLength()">
                <mat-icon>{{ hasMinLength() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Mínimo 8 caracteres
              </span>
              <span [class.req-met]="hasUppercase()">
                <mat-icon>{{ hasUppercase() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Al menos 1 letra mayúscula
              </span>
              <span [class.req-met]="hasNumber()">
                <mat-icon>{{ hasNumber() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Al menos 1 número
              </span>
              <span [class.req-met]="hasSymbol()">
                <mat-icon>{{ hasSymbol() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Al menos 1 símbolo (!&#64;#$...)
              </span>
            </div>
          </div>

          <!-- Error message -->
          <div *ngIf="errorMessage" class="error-box">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage }}
          </div>

          <!-- Success message -->
          <div *ngIf="successMessage" class="success-box">
            <mat-icon>check_circle</mat-icon>
            {{ successMessage }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="change-form">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Contraseña actual (temporal)</mat-label>
              <mat-icon matPrefix>key</mat-icon>
              <input matInput [type]="showCurrent ? 'text' : 'password'" formControlName="currentPassword"
                     placeholder="Contraseña que te asignaron">
              <button type="button" mat-icon-button matSuffix (click)="showCurrent = !showCurrent">
                <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error>Campo requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Nueva contraseña</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="showNew ? 'text' : 'password'" formControlName="newPassword"
                     placeholder="Tu nueva contraseña segura">
              <button type="button" mat-icon-button matSuffix (click)="showNew = !showNew">
                <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('newPassword')?.errors?.['required']">Requerido</mat-error>
              <mat-error *ngIf="form.get('newPassword')?.errors?.['weakness']">
                Faltan: {{ form.get('newPassword')?.errors?.['weakness'] }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Confirmar nueva contraseña</mat-label>
              <mat-icon matPrefix>lock_open</mat-icon>
              <input matInput [type]="showConfirm ? 'text' : 'password'" formControlName="confirmPassword"
                     placeholder="Repite tu nueva contraseña">
              <button type="button" mat-icon-button matSuffix (click)="showConfirm = !showConfirm">
                <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('confirmPassword')?.errors?.['required']">Requerido</mat-error>
              <mat-error *ngIf="form.errors?.['mismatch']">Las contraseñas no coinciden</mat-error>
            </mat-form-field>

            <button mat-flat-button type="submit" class="submit-btn"
                    [disabled]="form.invalid || isLoading">
              <mat-spinner *ngIf="isLoading" diameter="20" style="display:inline-block;margin-right:8px;"></mat-spinner>
              <mat-icon *ngIf="!isLoading">check_circle</mat-icon>
              {{ isLoading ? 'Guardando...' : 'Establecer Contraseña y Continuar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; }

    .change-password-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      font-family: 'Montserrat', sans-serif;
    }

    /* Left panel */
    .left-panel {
      flex: 1;
      background: linear-gradient(145deg, #272257 0%, #1a1740 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      padding: 40px;
      gap: 40px;
    }
    .brand-content { text-align: center; }
    .spin-logo {
      width: 120px; height: 120px; margin-bottom: 20px;
      animation: spin 30s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .brand-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 3.5rem; margin: 0; letter-spacing: 4px;
    }
    .brand-subtitle {
      font-size: 1.1rem; margin: 8px 0 0; opacity: 0.75; font-weight: 300;
    }
    .security-notice {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px 28px;
      text-align: center; max-width: 320px; border: 1px solid rgba(255,255,255,0.15);
    }
    .notice-icon {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;
    }
    .notice-icon mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .security-notice p { margin: 0; font-size: 14px; line-height: 1.6; opacity: 0.85; }

    /* Right panel */
    .right-panel {
      flex: 1;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px;
      overflow-y: auto;
    }
    .form-container {
      width: 100%; max-width: 480px;
      background: white;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 24px rgba(39,34,87,0.12);
    }
    .form-header { text-align: center; margin-bottom: 24px; }
    .lock-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      display: flex; align-items: center; justify-content: center;
      color: white; margin: 0 auto 16px;
    }
    .lock-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .form-title { margin: 0 0 8px; font-size: 2rem; color: #272257; letter-spacing: 1px; }
    .form-subtitle { margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; }

    /* Requirements */
    .requirements-box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 14px 16px; margin-bottom: 20px;
    }
    .req-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px;
    }
    .req-title mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .req-list { display: flex; flex-direction: column; gap: 6px; }
    .req-list span {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #94a3b8; transition: color 0.3s;
    }
    .req-list span mat-icon { font-size: 15px; width: 15px; height: 15px; color: #cbd5e1; transition: color 0.3s; }
    .req-list span.req-met { color: #16a34a; }
    .req-list span.req-met mat-icon { color: #16a34a; }

    /* Error / Success */
    .error-box {
      display: flex; align-items: center; gap: 8px;
      background: #fee2e2; color: #dc2626;
      padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;
      font-size: 13px; font-weight: 500;
    }
    .success-box {
      display: flex; align-items: center; gap: 8px;
      background: #dcfce7; color: #16a34a;
      padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;
      font-size: 13px; font-weight: 500;
    }

    /* Form */
    .change-form { display: flex; flex-direction: column; gap: 4px; }
    .w-full { width: 100%; }
    .submit-btn {
      width: 100%; height: 52px; margin-top: 8px;
      background: linear-gradient(135deg, #272257, #3b3a8c) !important;
      color: white !important; font-size: 14px; font-weight: 700;
      font-family: 'Montserrat', sans-serif;
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.92; }
    .submit-btn:disabled { opacity: 0.5; }
  `]
})
export class ChangePasswordComponent {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatchValidator });
  }

  get newPasswordValue(): string {
    return this.form.get('newPassword')?.value || '';
  }

  hasMinLength(): boolean { return this.newPasswordValue.length >= 8; }
  hasUppercase(): boolean { return /[A-Z]/.test(this.newPasswordValue); }
  hasNumber(): boolean { return /[0-9]/.test(this.newPasswordValue); }
  hasSymbol(): boolean { return /[^A-Za-z0-9]/.test(this.newPasswordValue); }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { currentPassword, newPassword, confirmPassword } = this.form.value;

    this.authService.changePassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '¡Contraseña actualizada correctamente! Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message;
        if (msg?.toLowerCase().includes('incorrect') || msg?.toLowerCase().includes('incorrecta') || err.status === 401) {
          this.errorMessage = 'La contraseña actual es incorrecta.';
        } else {
          this.errorMessage = msg || 'Error al cambiar la contraseña. Inténtalo de nuevo.';
        }
      }
    });
  }
}
