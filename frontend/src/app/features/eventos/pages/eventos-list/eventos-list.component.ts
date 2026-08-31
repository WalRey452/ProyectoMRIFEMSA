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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventosService } from '../../../../core/services/eventos.service';

@Component({
  selector: 'app-eventos-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="eventos-container">
      <header class="page-header">
        <h1 class="font-bebas">MONITOREO DE EVENTOS</h1>
        <button mat-raised-button class="btn-primary" routerLink="/eventos/nuevo">
          <mat-icon>add</mat-icon> REGISTRAR EVENTO
        </button>
      </header>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar Evento</mat-label>
          <input matInput [(ngModel)]="filters.search" (keyup.enter)="loadData()" placeholder="Buscar...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Tipo de Evento</mat-label>
          <mat-select [(ngModel)]="filters.tipo" (selectionChange)="loadData()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="RANSOMWARE">Ransomware</mat-option>
            <mat-option value="PHISHING">Phishing</mat-option>
            <mat-option value="DDOS">DDoS</mat-option>
            <mat-option value="MALWARE">Malware</mat-option>
            <mat-option value="ESCANEO_PUERTOS">Escaneo de Puertos</mat-option>
            <mat-option value="FUERZA_BRUTA">Fuerza Bruta</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="filters.estado" (selectionChange)="loadData()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="NUEVO">NUEVO</mat-option>
            <mat-option value="EN_ANALISIS">EN ANÁLISIS</mat-option>
            <mat-option value="ESCALADO">ESCALADO</mat-option>
            <mat-option value="CERRADO">CERRADO</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-container" *ngIf="!loading(); else loader">
        <table mat-table [dataSource]="data()" class="mat-elevation-z2">
          
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef> Código </th>
            <td mat-cell *matCellDef="let element"> <strong>{{element.codigoEvento || element.codigo}}</strong> </td>
          </ng-container>

          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef> Título </th>
            <td mat-cell *matCellDef="let element"> {{element.titulo}} </td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let element"> {{element.tipo}} </td>
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
              <span class="badge status-{{element.estado | lowercase}}">{{element.estado}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Detectado </th>
            <td mat-cell *matCellDef="let element"> {{element.fechaDeteccion | date:'short'}} </td>
          </ng-container>
          
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" [routerLink]="['/eventos', element.id]" matTooltip="Ver detalle">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="accent" [routerLink]="['/eventos', element.id, 'editar']" matTooltip="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" [routerLink]="['/incidentes/nuevo']" [queryParams]="{origen: element.id}" matTooltip="Escalar a Incidente">
                <mat-icon>campaign</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <mat-paginator [pageSizeOptions]="[10, 25, 50]"></mat-paginator>
      </div>
      
      <ng-template #loader>
        <div class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando eventos...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .eventos-container { padding: 20px; font-family: 'Montserrat', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; background-color: #272257; color: white; padding: 15px 25px; border-radius: 8px; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 28px; }
    .btn-primary { background-color: white !important; color: #272257 !important; font-weight: bold; }
    
    .filters-bar { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
    .filter-field { flex: 1; min-width: 200px; }
    
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; color: white; display: inline-block; }
    .sev-baja { background-color: #16a34a; }
    .sev-media { background-color: #f59e0b; }
    .sev-alta { background-color: #ea580c; }
    .sev-critica { background-color: #dc2626; }
    
    .status-nuevo { background-color: #3b82f6; }
    .status-en_analisis { background-color: #f59e0b; }
    .status-escalado { background-color: #dc2626; }
    .status-cerrado { background-color: #64748b; }
    
    .loading-state { text-align: center; padding: 50px; color: #666; }
  `]
})
export class EventosListComponent implements OnInit {
  displayedColumns: string[] = ['codigo', 'titulo', 'tipo', 'severidad', 'estado', 'fecha', 'acciones'];
  data = signal<any[]>([]);
  loading = signal<boolean>(true);
  
  filters = { search: '', tipo: '', estado: '' };

  constructor(private service: EventosService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.service.getAll(this.filters).subscribe({
      next: (res: any) => {
        const eventsArray = res.data ? res.data : (Array.isArray(res) ? res : []);
        this.data.set(eventsArray);
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
