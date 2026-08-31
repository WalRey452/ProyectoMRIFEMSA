import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'mri-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell-container">
      <mri-sidebar [isCollapsed]="!isSidebarOpen" class="sidebar-wrapper"></mri-sidebar>
      
      <div class="main-content">
        <mri-topbar (toggleSidebar)="toggleSidebar()"></mri-topbar>
        
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      
      <!-- Overlay for mobile -->
      <div *ngIf="isSidebarOpen" class="sidebar-overlay" (click)="isSidebarOpen = false"></div>
    </div>
  `,
  styles: [`
    .shell-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-color, #f3f4f6);
    }
    .sidebar-wrapper {
      z-index: 100;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      z-index: 90;
    }

    @media (max-width: 768px) {
      .sidebar-wrapper {
        position: fixed;
        height: 100%;
        transform: translateX(0);
        transition: transform 0.3s ease;
      }
      .sidebar-wrapper[isCollapsed="true"] {
        transform: translateX(-100%);
      }
      .sidebar-overlay {
        display: block;
      }
    }
  `]
})
export class ShellComponent {
  isSidebarOpen = true;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
