import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuditoriaService } from '../../../../core/services/auditoria.service';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bebas tracking-wide text-brand-primary m-0">Registro de Auditoría</h1>
        <button mat-stroked-button color="primary" class="border-brand-primary text-brand-primary" (click)="exportCsv()">
          <mat-icon>download</mat-icon>
          Exportar a CSV
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <mat-form-field appearance="outline" class="flex-1 min-w-[200px]">
          <mat-label>Buscar entidad o descripción...</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchControl">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-48">
          <mat-label>Tipo de Acción</mat-label>
          <mat-select [formControl]="actionControl">
            <mat-option value="">Todas</mat-option>
            <mat-option value="CREATE">Creación</mat-option>
            <mat-option value="UPDATE">Actualización</mat-option>
            <mat-option value="DELETE">Eliminación</mat-option>
            <mat-option value="LOGIN">Login</mat-option>
            <mat-option value="LOGOUT">Logout</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-48">
          <mat-label>Usuario</mat-label>
          <input matInput [formControl]="userControl" placeholder="Username">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-64">
          <mat-label>Rango de Fechas</mat-label>
          <mat-date-range-input [rangePicker]="picker">
            <input matStartDate placeholder="Inicio">
            <input matEndDate placeholder="Fin">
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table mat-table [dataSource]="filteredData()" class="w-full">
          
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">Fecha/Hora</th>
            <td mat-cell *matCellDef="let row" class="text-sm">{{ row.fecha | date:'dd/MM/yyyy HH:mm:ss' }}</td>
          </ng-container>

          <ng-container matColumnDef="usuario">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">Usuario</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-medium">{{ row.usuario }}</td>
          </ng-container>

          <ng-container matColumnDef="accion">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">Acción</th>
            <td mat-cell *matCellDef="let row">
              <span class="px-2 py-1 rounded text-xs font-bold"
                    [ngClass]="{
                      'bg-green-100 text-green-700': row.accion === 'CREATE',
                      'bg-blue-100 text-blue-700': row.accion === 'UPDATE',
                      'bg-red-100 text-red-700': row.accion === 'DELETE',
                      'bg-brand-primary/10 text-brand-primary': row.accion === 'LOGIN',
                      'bg-gray-100 text-gray-700': row.accion === 'LOGOUT'
                    }">
                {{ row.accion }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="entidad">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">Entidad</th>
            <td mat-cell *matCellDef="let row" class="text-sm">{{ row.entidad }}</td>
          </ng-container>

          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">Código</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-mono text-gray-500">{{ row.codigo || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="descripcion">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">Descripción</th>
            <td mat-cell *matCellDef="let row" class="text-sm text-gray-600 truncate max-w-xs" [title]="row.descripcion">
              {{ row.descripcion }}
            </td>
          </ng-container>

          <ng-container matColumnDef="ip">
            <th mat-header-cell *matHeaderCellDef class="font-montserrat font-bold text-gray-700">IP Address</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-mono text-gray-400">{{ row.ip }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50 transition-colors"></tr>
          
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center py-8 text-gray-500" [attr.colspan]="displayedColumns.length">
              No se encontraron registros de auditoría.
            </td>
          </tr>
        </table>
        
        <mat-paginator [length]="totalItems()"
                       [pageSize]="pageSize()"
                       [pageSizeOptions]="[10, 25, 50, 100]"
                       (page)="onPageChange($event)"
                       aria-label="Seleccionar página">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .text-brand-primary { color: #272257; }
    .border-brand-primary { border-color: #272257; }
    .bg-brand-primary { background-color: #272257; }
    .font-bebas { font-family: 'Bebas Neue', sans-serif; }
    .font-montserrat { font-family: 'Montserrat', sans-serif; }
    tr.mat-mdc-row:hover { background-color: #f9fafb !important; }
  `]
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);

  displayedColumns: string[] = ['fecha', 'usuario', 'accion', 'entidad', 'codigo', 'descripcion', 'ip'];
  
  allData = signal<any[]>([]);
  filteredData = signal<any[]>([]);
  
  totalItems = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  searchControl = new FormControl('');
  actionControl = new FormControl('');
  userControl = new FormControl('');

  ngOnInit() {
    this.loadData();

    // In a real app, we would debounce and call API, for demo we filter locally
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.actionControl.valueChanges.subscribe(() => this.applyFilters());
    this.userControl.valueChanges.subscribe(() => this.applyFilters());
  }

  loadData() {
    this.auditoriaService.getAll().subscribe({
      next: (data) => {
        const mockData = data?.length ? data : this.generateMockLogs();
        this.allData.set(mockData);
        this.applyFilters();
      },
      error: () => {
        this.allData.set(this.generateMockLogs());
        this.applyFilters();
      }
    });
  }

  applyFilters() {
    let filtered = this.allData();
    const search = this.searchControl.value?.toLowerCase() || '';
    const action = this.actionControl.value;
    const user = this.userControl.value?.toLowerCase() || '';

    if (search) {
      filtered = filtered.filter(item => 
        item.entidad.toLowerCase().includes(search) || 
        item.descripcion.toLowerCase().includes(search) ||
        (item.codigo && item.codigo.toLowerCase().includes(search))
      );
    }
    if (action) {
      filtered = filtered.filter(item => item.accion === action);
    }
    if (user) {
      filtered = filtered.filter(item => item.usuario.toLowerCase().includes(user));
    }

    this.totalItems.set(filtered.length);
    
    // Manual pagination for demo
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    this.filteredData.set(filtered.slice(start, end));
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.applyFilters();
  }

  exportCsv() {
    console.log('Exporting CSV...');
    // Demo implementation
    alert('Exportando CSV...');
  }

  private generateMockLogs() {
    const logs = [];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
    const entities = ['Incidentes', 'Playbooks', 'Usuarios', 'Contactos', 'Sistema'];
    const users = ['admin', 'j.perez', 'a.gomez', 'c.ruiz'];
    
    for (let i = 0; i < 50; i++) {
      logs.push({
        id: i.toString(),
        fecha: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        usuario: users[Math.floor(Math.random() * users.length)],
        accion: actions[Math.floor(Math.random() * actions.length)],
        entidad: entities[Math.floor(Math.random() * entities.length)],
        codigo: Math.random() > 0.5 ? `INC-${Math.floor(Math.random() * 1000)}` : null,
        descripcion: `Acción registrada por sistema para auditoría #${i}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`
      });
    }
    return logs.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }
}
