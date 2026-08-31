import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'mri-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  template: `
    <div class="login-container">
      <div class="left-panel">
        <div class="brand-content">
          <img src="assets/logo-icon.png" alt="Logo FEMSA" class="labyrinth-logo">
          <h1 class="brand-title">REGISTRO MRI</h1>
          <p class="brand-subtitle">FEMSA Salud</p>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="login-form-container">
          <h2>Iniciar Sesión</h2>
          <p class="subtitle">Ingrese su correo electrónico y contraseña</p>
          
          <div *ngIf="errorMessage" class="error-message">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage }}
          </div>
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="username" placeholder="usuario@femsasalud.com" autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                El correo es requerido
              </mat-error>
              <mat-error *ngIf="loginForm.get('username')?.hasError('email')">
                Ingrese un correo electrónico válido
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Ingrese su contraseña">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                La contraseña es requerida
              </mat-error>
            </mat-form-field>
            
            <button mat-flat-button color="primary" class="login-button btn-primary" type="submit" [disabled]="loginForm.invalid || isLoading">
              {{ isLoading ? 'INGRESANDO...' : 'INGRESAR' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      height: 100vh;
      width: 100vw;
    }
    .left-panel {
      flex: 1;
      background-color: #272257;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
    }
    .brand-content {
      text-align: center;
    }
    .labyrinth-logo {
      width: 150px;
      height: 150px;
      margin-bottom: 24px;
      animation: spin 30s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    .brand-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 4rem;
      margin: 0;
      letter-spacing: 4px;
    }
    .brand-subtitle {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.25rem;
      margin: 8px 0 0;
      opacity: 0.8;
      font-weight: 300;
    }
    
    .right-panel {
      flex: 1;
      background-color: #FFFFFF;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .login-form-container {
      width: 100%;
      max-width: 400px;
      padding: 32px;
    }
    .login-form-container h2 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.5rem;
      color: #272257;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 32px;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .full-width {
      width: 100%;
      display: block;
      margin-bottom: 16px;
    }
    .login-button {
      width: 100%;
      height: 48px;
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 16px;
    }
    .error-message {
      background-color: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .login-container {
        flex-direction: column;
      }
      .left-panel {
        padding: 40px 20px;
        flex: none;
      }
      .brand-title {
        font-size: 3rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Si el usuario debe cambiar contraseña, redirigir a esa pantalla
        const mustChange = res?.mustChangePassword || this.authService.user()?.mustChangePassword;
        if (mustChange) {
          this.router.navigate(['/auth/change-password']);
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Credenciales inválidas';
        } else if (err.status === 423) {
          this.errorMessage = 'Cuenta bloqueada';
        } else {
          this.errorMessage = 'Ocurrió un error al intentar iniciar sesión';
        }
      }
    });
  }
}
