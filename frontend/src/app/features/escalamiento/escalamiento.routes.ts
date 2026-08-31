import { Routes } from '@angular/router';

export const ESCALAMIENTO_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/escalamiento/escalamiento.component').then(m => m.EscalamientoComponent) },
];
