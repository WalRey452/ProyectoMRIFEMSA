import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'mri-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule],
  template: `
    <div class="sidebar-container" [class.collapsed]="isCollapsed">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="assets/logo-icon.png" alt="Logo" class="mini-logo">
        </div>
        <div class="brand-text" *ngIf="!isCollapsed">
          <h2 class="title">REGISTRO MRI</h2>
          <span class="subtitle">FEMSA Salud</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" matRipple>
          <mat-icon>dashboard</mat-icon>
          <span *ngIf="!isCollapsed">Dashboard</span>
        </a>
        <a routerLink="/incidentes" routerLinkActive="active" class="nav-item" matRipple>
          <mat-icon>security</mat-icon>
          <span *ngIf="!isCollapsed">Incidentes</span>
        </a>
        <a routerLink="/eventos" routerLinkActive="active" class="nav-item" matRipple>
          <mat-icon>bolt</mat-icon>
          <span *ngIf="!isCollapsed">Eventos</span>
        </a>
        <a routerLink="/playbooks" routerLinkActive="active" class="nav-item" matRipple>
          <mat-icon>menu_book</mat-icon>
          <span *ngIf="!isCollapsed">Playbooks</span>
        </a>
        <a routerLink="/escalamiento" routerLinkActive="active" class="nav-item" matRipple>
          <mat-icon>account_tree</mat-icon>
          <span *ngIf="!isCollapsed">Escalamiento</span>
        </a>

        <!-- Admin Only -->
        <ng-container *ngIf="isAdmin()">
          <div class="nav-divider"></div>
          <a routerLink="/admin" routerLinkActive="active" class="nav-item" matRipple>
            <mat-icon>admin_panel_settings</mat-icon>
            <span *ngIf="!isCollapsed">Administración</span>
          </a>
        </ng-container>
      </nav>

      <div class="sidebar-footer" *ngIf="!isCollapsed">
        <div class="user-info">
          <div class="avatar">{{ getUserInitials() }}</div>
          <div class="details">
            <span class="name">{{ (currentUser()?.firstName) || 'Usuario' }}</span>
            <span class="role">{{ (currentUser()?.role) || 'Rol' }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" matRipple>
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      width: 260px;
      height: 100vh;
      background-color: #272257;
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow-x: hidden;
    }
    .sidebar-container.collapsed {
      width: 72px;
    }
    .sidebar-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo-container {
      min-width: 40px;
      display: flex;
      justify-content: center;
    }
    .mini-logo {
      width: 40px;
      height: 40px;
      animation: spin 30s linear infinite;
    }
    .brand-text {
      white-space: nowrap;
    }
    .brand-text .title {
      font-family: 'Bebas Neue', sans-serif;
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: 1px;
    }
    .brand-text .subtitle {
      font-size: 0.75rem;
      opacity: 0.7;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 16px 0;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      gap: 16px;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      white-space: nowrap;
    }
    .nav-item:hover {
      background-color: rgba(255,255,255,0.08);
      color: white;
    }
    .nav-item.active {
      background-color: rgba(255,255,255,0.15);
      border-left-color: white;
      color: white;
    }
    .nav-item mat-icon {
      min-width: 24px;
    }
    .nav-divider {
      height: 1px;
      background-color: rgba(255,255,255,0.1);
      margin: 16px 24px;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }
    .avatar {
      width: 36px;
      height: 36px;
      background-color: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }
    .details {
      display: flex;
      flex-direction: column;
      white-space: nowrap;
      overflow: hidden;
    }
    .details .name {
      font-size: 0.875rem;
      font-weight: 500;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .details .role {
      font-size: 0.75rem;
      opacity: 0.7;
    }
    .logout-btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logout-btn:hover {
      background-color: rgba(255,255,255,0.1);
    }
  `]
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  
  currentUser = this.authService.user;

  constructor(private authService: AuthService) {}

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user || !user.firstName) return 'U';
    return user.firstName.substring(0, 2).toUpperCase();
  }

  logout() {
    this.authService.logout();
  }
}
