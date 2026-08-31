import { Routes } from '@angular/router';

export const AUDITORIA_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/auditoria/auditoria.component').then(m => m.AuditoriaComponent) },
];
