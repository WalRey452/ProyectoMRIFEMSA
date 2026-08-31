import { Routes } from '@angular/router';

export const INCIDENTES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/incidentes-list/incidentes-list.component').then(m => m.IncidentesListComponent) },
  { path: 'nuevo', loadComponent: () => import('./pages/incidente-form/incidente-form.component').then(m => m.IncidenteFormComponent) },
  { path: ':id', loadComponent: () => import('./pages/incidente-detail/incidente-detail.component').then(m => m.IncidenteDetailComponent) },
  { path: ':id/editar', loadComponent: () => import('./pages/incidente-form/incidente-form.component').then(m => m.IncidenteFormComponent) },
];
