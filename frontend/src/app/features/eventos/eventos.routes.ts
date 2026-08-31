import { Routes } from '@angular/router';

export const EVENTOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/eventos-list/eventos-list.component').then(m => m.EventosListComponent) },
  { path: 'nuevo', loadComponent: () => import('./pages/evento-form/evento-form.component').then(m => m.EventoFormComponent) },
  { path: ':id', loadComponent: () => import('./pages/evento-detail/evento-detail.component').then(m => m.EventoDetailComponent) },
  { path: ':id/editar', loadComponent: () => import('./pages/evento-form/evento-form.component').then(m => m.EventoFormComponent) },
];
