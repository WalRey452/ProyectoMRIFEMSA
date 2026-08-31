import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  cargo: string;
  role: 'ADMIN' | 'ANALISTA' | 'VIEWER';
  avatarUrl?: string;
  mustChangePassword: boolean;
  lastPasswordChange?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  passwordExpiresIn?: number; // días
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // ─── Reactive state con signals ──────────────────────────
  private _user = signal<User | null>(this.loadUserFromStorage());
  private _token = signal<string | null>(localStorage.getItem('mri_access_token'));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly isAnalista = computed(() => this._user()?.role === 'ANALISTA' || this._user()?.role === 'ADMIN');
  readonly fullName = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /** Iniciar sesión */
  login(username: string, password: string) {
    return this.http.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
      mustChangePassword: boolean;
      passwordExpiresIn?: number;
    }>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        this.setSession(response.accessToken, response.user);
        if (response.refreshToken) {
          localStorage.setItem('mri_refresh_token', response.refreshToken);
        }
      }),
    );
  }

  /** Cerrar sesión (voluntario) — avisa al backend */
  logout() {
    const refreshToken = localStorage.getItem('mri_refresh_token');
    this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /** Limpiar sesión local sin llamar al backend (token ya inválido/expirado) */
  clearSessionAndRedirect() {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /** Cambiar contraseña */
  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword, newPassword, confirmPassword,
    }).pipe(
      tap(() => {
        const user = this._user();
        if (user) {
          const updated = { ...user, mustChangePassword: false };
          this._user.set(updated);
          localStorage.setItem('mri_user', JSON.stringify(updated));
        }
      }),
    );
  }

  /** Solicitar reseteo de contraseña */
  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  /** Resetear contraseña con token */
  resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword, confirmPassword });
  }

  /** Refrescar token JWT */
  refreshToken() {
    const refreshToken = localStorage.getItem('mri_refresh_token');
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/refresh`, {}, {
      headers: { 'X-Refresh-Token': refreshToken },
    }).pipe(
      tap(response => {
        this._token.set(response.accessToken);
        localStorage.setItem('mri_access_token', response.accessToken);
      }),
    );
  }

  /** Obtener estado de expiración de contraseña */
  getPasswordStatus() {
    return this.http.get<{ expiresIn: number; isExpired: boolean }>(`${this.apiUrl}/password-status`);
  }

  /** Actualizar datos del usuario en estado local */
  updateUserState(updates: Partial<User>) {
    const current = this._user();
    if (current) {
      const updated = { ...current, ...updates };
      this._user.set(updated);
      localStorage.setItem('mri_user', JSON.stringify(updated));
    }
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this._user()?.role;
    if (!userRole) return false;
    if (Array.isArray(role)) return role.includes(userRole);
    return userRole === role;
  }

  private setSession(token: string, user: User) {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem('mri_access_token', token);
    localStorage.setItem('mri_user', JSON.stringify(user));
  }

  private clearSession() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('mri_access_token');
    localStorage.removeItem('mri_refresh_token');
    localStorage.removeItem('mri_user');
  }

  private loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem('mri_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
