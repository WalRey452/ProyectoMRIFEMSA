import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { changePasswordGuard } from './core/guards/change-password.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard, changePasswordGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
      { path: 'incidentes',   loadChildren: () => import('./features/incidentes/incidentes.routes').then(m => m.INCIDENTES_ROUTES) },
      { path: 'eventos',      loadChildren: () => import('./features/eventos/eventos.routes').then(m => m.EVENTOS_ROUTES) },
      { path: 'playbooks',    loadChildren: () => import('./features/playbooks/playbooks.routes').then(m => m.PLAYBOOKS_ROUTES) },
      { path: 'escalamiento', loadChildren: () => import('./features/escalamiento/escalamiento.routes').then(m => m.ESCALAMIENTO_ROUTES) },
      { path: 'auditoria',    loadChildren: () => import('./features/auditoria/auditoria.routes').then(m => m.AUDITORIA_ROUTES) },
      {
        // Ruta protegida: solo el rol ADMIN puede acceder al módulo de administración.
        // El roleGuard redirige al dashboard si el usuario no tiene permisos suficientes.
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },
      { path: 'perfil',       loadChildren: () => import('./features/perfil/perfil.routes').then(m => m.PERFIL_ROUTES) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
