import { Routes } from '@angular/router';

export const PLAYBOOKS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/playbooks-list/playbooks-list.component').then(m => m.PlaybooksListComponent) },
];
