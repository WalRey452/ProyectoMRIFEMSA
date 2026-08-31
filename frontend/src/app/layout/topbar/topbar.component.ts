import { Component, EventEmitter, Output, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

/**
 * Interfaz para los items de notificación mostrados en el panel de alertas.
 */
interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'danger' | 'warning' | 'info';
  icon: string;
  read: boolean;
}

/**
 * Componente de barra superior de la aplicación.
 *
 * Responsabilidades:
 *  - Botón de menú hamburguesa para colapsar/expandir el sidebar.
 *  - Panel de notificaciones con actividad reciente del sistema.
 *  - Menú de usuario: nombre, apellido, correo, rol, acceso a perfil y logout.
 */
@Component({
  selector: 'mri-topbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  template: `
    <header class="topbar-container">
      <div class="left-section">
        <button mat-icon-button (click)="toggleSidebar.emit()" aria-label="Abrir/cerrar menú">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="breadcrumb">
          <span class="path-segment">Registro MRI</span>
        </div>
      </div>

      <div class="right-section">

        <!-- ─── Campana de Notificaciones ──────────────────────────── -->
        <button
          mat-icon-button
          class="notification-btn"
          [matMenuTriggerFor]="notifMenu"
          aria-label="Ver notificaciones"
          matTooltip="Notificaciones">
          <mat-icon>notifications</mat-icon>
          <span class="notification-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
        </button>

        <!-- Panel de notificaciones -->
        <mat-menu #notifMenu="matMenu" class="notif-menu-panel" xPosition="before">
          <div class="notif-header" (click)="$event.stopPropagation()">
            <span class="notif-title">Notificaciones</span>
            <button *ngIf="unreadCount() > 0" class="mark-all-btn" (click)="markAllRead()">
              Marcar todo leído
            </button>
          </div>
          <mat-divider></mat-divider>

          <div *ngIf="notifications().length === 0" class="notif-empty" (click)="$event.stopPropagation()">
            <mat-icon>notifications_none</mat-icon>
            <p>No hay notificaciones recientes</p>
          </div>

          <div *ngFor="let n of notifications()" class="notif-item" [class.unread]="!n.read" (click)="markRead(n)">
            <div class="notif-icon" [class]="'notif-icon-' + n.type">
              <mat-icon>{{ n.icon }}</mat-icon>
            </div>
            <div class="notif-content">
              <p class="notif-item-title">{{ n.title }}</p>
              <p class="notif-item-desc">{{ n.description }}</p>
              <span class="notif-time">{{ n.time }}</span>
            </div>
          </div>
        </mat-menu>

        <!-- ─── Menú de Usuario ─────────────────────────────────────── -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-btn" aria-label="Menú de cuenta">
          <div class="user-avatar">{{ getUserInitials() }}</div>
          <span class="user-name">{{ currentUser()?.firstName || 'Usuario' }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" class="user-menu-panel" xPosition="before">
          <!-- Encabezado con datos del usuario -->
          <div class="menu-header" (click)="$event.stopPropagation()">
            <div class="menu-avatar-lg">{{ getUserInitials() }}</div>
            <div class="menu-user-info">
              <strong class="menu-fullname">
                {{ currentUser()?.firstName }} {{ currentUser()?.lastName }}
              </strong>
              <span class="menu-email" [title]="currentUser()?.email || ''">
                {{ currentUser()?.email }}
              </span>
              <span class="menu-role-badge" [class]="'role-' + (currentUser()?.role || 'viewer') | lowercase">
                {{ getRoleLabel(currentUser()?.role) }}
              </span>
            </div>
          </div>
          <mat-divider></mat-divider>

          <a mat-menu-item routerLink="/perfil" id="menu-mi-perfil">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil</span>
          </a>
          <a mat-menu-item routerLink="/perfil" fragment="cambiar-contrasena" id="menu-cambiar-contrasena">
            <mat-icon>vpn_key</mat-icon>
            <span>Cambiar Contraseña</span>
          </a>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()" id="menu-cerrar-sesion">
            <mat-icon color="warn">logout</mat-icon>
            <span class="text-warn">Cerrar Sesión</span>
          </button>
        </mat-menu>

      </div>
    </header>
  `,
  styles: [`
    /* ── Layout general ─────────────────────────────────────────── */
    .topbar-container {
      height: 64px;
      background-color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      z-index: 10;
    }
    .left-section, .right-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── Breadcrumb ─────────────────────────────────────────────── */
    .breadcrumb {
      font-family: var(--font-headings, 'Bebas Neue', sans-serif);
      font-size: 1.25rem;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-left: 8px;
    }

    /* ── Botón de notificaciones ────────────────────────────────── */
    .notification-btn {
      position: relative;
    }
    .notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      background-color: #dc2626;
      color: white;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      pointer-events: none;
    }

    /* ── Panel de notificaciones ────────────────────────────────── */
    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
    }
    .notif-title {
      font-weight: 700;
      font-size: 14px;
      color: #1e293b;
      font-family: 'Montserrat', sans-serif;
    }
    .mark-all-btn {
      background: none;
      border: none;
      color: #272257;
      font-size: 12px;
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      padding: 0;
    }
    .mark-all-btn:hover { text-decoration: underline; }

    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 24px;
      color: #94a3b8;
      min-width: 320px;
    }
    .notif-empty mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .notif-empty p { margin: 0; font-size: 13px; }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      min-width: 320px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.unread { background: #f0f4ff; }
    .notif-item.unread:hover { background: #e8eeff; }

    .notif-icon {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .notif-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .notif-icon-danger  { background: #fee2e2; color: #dc2626; }
    .notif-icon-warning { background: #fef3c7; color: #d97706; }
    .notif-icon-info    { background: #dbeafe; color: #2563eb; }

    .notif-content { flex: 1; min-width: 0; }
    .notif-item-title { margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #1e293b; }
    .notif-item-desc  { margin: 0 0 4px; font-size: 12px; color: #64748b; line-height: 1.4; }
    .notif-time       { font-size: 11px; color: #94a3b8; }

    /* ── Botón usuario ──────────────────────────────────────────── */
    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 32px;
    }
    .user-avatar {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem;
      flex-shrink: 0;
    }
    .user-name { margin: 0 4px; font-weight: 500; }

    /* ── Panel menú usuario ─────────────────────────────────────── */
    .menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      min-width: 260px;
    }
    .menu-avatar-lg {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.1rem;
      flex-shrink: 0;
    }
    .menu-user-info {
      display: flex; flex-direction: column; gap: 3px;
      min-width: 0; flex: 1;
    }
    .menu-fullname {
      font-size: 14px; color: #1e293b; font-weight: 700;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .menu-email {
      font-size: 12px; color: #6b7280;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 200px; display: block;
    }
    .menu-role-badge {
      display: inline-block;
      font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 12px;
      width: fit-content;
    }
    .menu-role-badge.role-admin   { background: #272257; color: white; }
    .menu-role-badge.role-analista{ background: #dbeafe; color: #1d4ed8; }
    .menu-role-badge.role-viewer  { background: #f1f5f9; color: #475569; }

    .text-warn { color: #f44336; }

    /* ── Responsive ─────────────────────────────────────────────── */
    @media (max-width: 600px) {
      .user-name { display: none; }
    }
  `]
})
export class TopbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  /** Usuario actualmente autenticado, expuesto como signal de solo lectura. */
  currentUser = this.authService.user;

  /** Lista reactiva de notificaciones del sistema. */
  notifications = signal<NotificationItem[]>([]);

  /** Contador de notificaciones no leídas. */
  unreadCount = signal<number>(0);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  /**
   * Carga las notificaciones iniciales del sistema.
   * En una versión futura, esto puede conectarse al WebSocket del backend
   * para recibir alertas en tiempo real.
   */
  loadNotifications(): void {
    // Notificaciones basadas en el estado del sistema (simuladas en esta versión).
    // TODO: Conectar a endpoint real GET /api/v1/notifications cuando esté disponible.
    const items: NotificationItem[] = [
      {
        id: '1',
        title: 'Bienvenido al sistema',
        description: 'Registro MRI está activo y conectado a Neon.tech.',
        time: 'Ahora',
        type: 'info',
        icon: 'verified_user',
        read: false,
      },
    ];
    this.notifications.set(items);
    this.updateUnreadCount();
  }

  /** Marca una notificación individual como leída. */
  markRead(notification: NotificationItem): void {
    notification.read = true;
    this.notifications.update(n => [...n]);
    this.updateUnreadCount();
  }

  /** Marca todas las notificaciones como leídas. */
  markAllRead(): void {
    this.notifications.update(items => items.map(n => ({ ...n, read: true })));
    this.updateUnreadCount();
  }

  /** Actualiza el contador de no leídos. */
  private updateUnreadCount(): void {
    this.unreadCount.set(this.notifications().filter(n => !n.read).length);
  }

  /**
   * Retorna las iniciales del usuario actual para mostrar en el avatar.
   * Usa firstName + lastName; si no hay datos, retorna 'U'.
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.[0] ?? '';
    const last  = user.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
  }

  /**
   * Traduce el rol técnico a etiqueta visible en español.
   */
  getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      ADMIN:    '👑 MRI',
      ANALISTA: '🔎 Analista',
      VIEWER:   '👁️ Viewer',
    };
    return labels[role ?? ''] ?? role ?? '';
  }

  /** Cierra la sesión del usuario actual. */
  logout(): void {
    this.authService.logout();
  }
}
