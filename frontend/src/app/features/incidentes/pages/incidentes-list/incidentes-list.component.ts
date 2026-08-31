import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IncidentesService } from '../../../../core/services/incidentes.service';

@Component({
  selector: 'app-incidentes-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatInputModule, MatFormFieldModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="incidentes-container">
      <header class="page-header">
        <h1 class="font-bebas">GESTIÓN DE INCIDENTES</h1>
        <button mat-raised-button class="btn-primary" routerLink="/incidentes/nuevo">
          <mat-icon>add</mat-icon> NUEVO INCIDENTE
        </button>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">TOTAL</div>
          <div class="stat-value">{{stats().total}}</div>
        </div>
        <div class="stat-card critic">
          <div class="stat-title">CRÍTICOS</div>
          <div class="stat-value">{{stats().criticos}}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-title">EN ATENCIÓN</div>
          <div class="stat-value">{{stats().enAtencion}}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-title">CERRADOS MES</div>
          <div class="stat-value">{{stats().cerradosMes}}</div>
        </div>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar</mat-label>
          <input matInput [(ngModel)]="filters.search" (keyup.enter)="loadData()" placeholder="Ej. Código o Título">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Categoría</mat-label>
          <mat-select [(ngModel)]="filters.categoria" (selectionChange)="loadData()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="MALWARE">MALWARE</mat-option>
            <mat-option value="RANSOMWARE">RANSOMWARE</mat-option>
            <mat-option value="PHISHING">PHISHING</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Severidad</mat-label>
          <mat-select [(ngModel)]="filters.severidad" (selectionChange)="loadData()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="BAJA">BAJA</mat-option>
            <mat-option value="MEDIA">MEDIA</mat-option>
            <mat-option value="ALTA">ALTA</mat-option>
            <mat-option value="CRITICA">CRITICA</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-container" *ngIf="!loading(); else loader">
        <table mat-table [dataSource]="data()" class="mat-elevation-z2" *ngIf="data().length > 0; else emptyState">
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef> Código </th>
            <td mat-cell *matCellDef="let element"> <strong>{{element.codigoIncidente || element.codigo}}</strong> </td>
          </ng-container>

          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef> Título </th>
            <td mat-cell *matCellDef="let element"> {{element.titulo}} </td>
          </ng-container>

          <ng-container matColumnDef="categoria">
            <th mat-header-cell *matHeaderCellDef> Categoría </th>
            <td mat-cell *matCellDef="let element"> {{element.categoria}} </td>
          </ng-container>

          <ng-container matColumnDef="severidad">
            <th mat-header-cell *matHeaderCellDef> Severidad </th>
            <td mat-cell *matCellDef="let element">
              <span class="badge sev-{{element.severidad | lowercase}}">{{element.severidad}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let element">
              <span class="badge status">{{element.estado}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Fecha </th>
            <td mat-cell *matCellDef="let element"> {{element.fechaIdentificacion | date}} </td>
          </ng-container>
          
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" [routerLink]="['/incidentes', element.id]" matTooltip="Ver detalle">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="accent" [routerLink]="['/incidentes', element.id, 'editar']" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <ng-template #emptyState>
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No se encontraron incidentes</p>
          </div>
        </ng-template>
        
        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
      </div>
      
      <ng-template #loader>
        <div class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando incidentes...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .incidentes-container { padding: 20px; font-family: 'Montserrat', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; background-color: #272257; color: white; padding: 15px 25px; border-radius: 8px; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 28px; }
    .btn-primary { background-color: white !important; color: #272257 !important; font-weight: bold; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 5px solid #272257; }
    .stat-card.critic { border-left-color: #dc2626; }
    .stat-card.warning { border-left-color: #f59e0b; }
    .stat-card.success { border-left-color: #16a34a; }
    .stat-title { font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; }
    .stat-value { font-size: 28px; font-weight: bold; color: #333; margin-top: 5px; }
    
    .filters-bar { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
    .filter-field { flex: 1; min-width: 200px; }
    
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; color: white; display: inline-block; }
    .sev-baja { background-color: #16a34a; }
    .sev-media { background-color: #f59e0b; }
    .sev-alta { background-color: #ea580c; }
    .sev-critica { background-color: #dc2626; animation: pulse 2s infinite; }
    
    .tlp-white { background-color: #9ca3af; color: black; }
    .tlp-green { background-color: #16a34a; }
    .tlp-amber { background-color: #f59e0b; }
    .tlp-red { background-color: #dc2626; }
    
    .status { background-color: #2563eb; }
    
    .empty-state, .loading-state { text-align: center; padding: 50px 20px; color: #666; }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 15px; opacity: 0.5; }
    .loading-state mat-spinner { margin: 0 auto 20px; }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }
  `]
})
export class IncidentesListComponent implements OnInit {
  displayedColumns: string[] = ['codigo', 'titulo', 'categoria', 'severidad', 'estado', 'fecha', 'acciones'];
  data = signal<any[]>([]);
  stats = signal<any>({ total: 0, criticos: 0, enAtencion: 0, cerradosMes: 0 });
  loading = signal<boolean>(true);
  
  filters = {
    search: '',
    categoria: '',
    severidad: ''
  };

  constructor(private incidentesService: IncidentesService) {}

  ngOnInit() {
    this.loadStats();
    this.loadData();
  }

  loadStats() {
    this.incidentesService.getStats().subscribe({
      next: (res) => this.stats.set(res || { total: 0, criticos: 0, enAtencion: 0, cerradosMes: 0 }),
      error: () => {}
    });
  }

  loadData() {
    this.loading.set(true);
    this.incidentesService.getAll(this.filters).subscribe({
      next: (res: any) => {
        // Extraemos 'data' si viene de la paginación del backend, de lo contrario usamos res.
        const incidentsArray = res.data ? res.data : (Array.isArray(res) ? res : []);
        this.data.set(incidentsArray);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.data.set([]);
        this.loading.set(false);
      }
    });
  }
}
