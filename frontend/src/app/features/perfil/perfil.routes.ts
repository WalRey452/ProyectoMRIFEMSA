import { Routes } from '@angular/router';

export const PERFIL_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
];
