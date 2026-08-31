import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IncidentesService } from '../../../../core/services/incidentes.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';

@Component({
  selector: 'app-incidente-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatDividerModule
  ],
  template: `
    <div class="detail-container" *ngIf="incidente(); else loader">
      <header class="detail-header">
        <div class="title-section">
          <div class="codigo font-bebas">{{incidente()?.codigoIncidente || incidente()?.codigo}}</div>
          <h1>{{incidente()?.titulo}}</h1>
          <div class="badges">
            <span class="badge sev-{{incidente()?.severidad | lowercase}}">{{incidente()?.severidad}}</span>
            <span class="badge status">{{incidente()?.estado}}</span>
            <span class="badge" style="background:#475569" *ngIf="incidente()?.triage">Triage: {{incidente()?.triage}}</span>
          </div>
        </div>
        <div class="actions-section">
          <button mat-raised-button class="btn-outline" (click)="generatePDF()">
            <mat-icon>picture_as_pdf</mat-icon> INFORME PDF
          </button>
          <button mat-raised-button color="accent" [routerLink]="['/incidentes', incidente()?.id, 'editar']">
            <mat-icon>edit</mat-icon> EDITAR
          </button>
        </div>
      </header>

      <!-- 1. RESUMEN EJECUTIVO -->
      <div class="content-section">
        <h2 class="font-bebas section-title"><mat-icon>assessment</mat-icon> 1. RESUMEN EJECUTIVO</h2>
        <div class="info-grid-4 mb-20">
          <div class="info-item"><div class="label">Categoría</div><div class="value font-bold">{{incidente()?.categoria}}</div></div>
          <div class="info-item"><div class="label">Fecha Identificación</div><div class="value">{{incidente()?.fechaIdentificacion | date:'medium'}}</div></div>
          <div class="info-item"><div class="label">Creado Por</div><div class="value">{{(incidente()?.creadoPor ? (incidente()?.creadoPor?.firstName + ' ' + incidente()?.creadoPor?.lastName) : incidente()?.reportadoPor) || 'Sistema'}}</div></div>
          <div class="info-item"><div class="label">Líder Asignado</div><div class="value">{{incidente()?.liderIncidenteId || incidente()?.liderId || 'No asignado'}}</div></div>
        </div>
        <div class="text-blockquote">
          <strong>Descripción del Incidente:</strong><br>
          {{incidente()?.resumenEjecutivo || 'Sin descripción.'}}
        </div>
      </div>

      <!-- 2. ORIGEN Y DIAGNÓSTICO -->
      <div class="content-section">
        <h2 class="font-bebas section-title"><mat-icon>troubleshoot</mat-icon> 2. ORIGEN Y DIAGNÓSTICO</h2>
        <div class="info-grid-3">
          <div class="info-item"><div class="label">Origen</div><div class="value">{{incidente()?.origen || 'No especificado'}}</div></div>
          <div class="info-item"><div class="label">Fuente / Herramienta</div><div class="value">{{incidente()?.fuenteHerramienta || 'No especificada'}}</div></div>
          <div class="info-item"><div class="label">Criticidad del Activo</div><div class="value">{{incidente()?.criticidadActivo || 'No evaluada'}}</div></div>
        </div>
        
        <div class="info-grid-2 mt-15" *ngIf="incidente()?.riesgoAsociado">
          <div class="info-item"><div class="label">Riesgo Asociado</div><div class="value">{{incidente()?.riesgoAsociado}}</div></div>
        </div>
      </div>

      <!-- 3. IMPACTO Y AFECTACIÓN -->
      <div class="content-section">
        <h2 class="font-bebas section-title"><mat-icon>warning</mat-icon> 3. IMPACTO Y AFECTACIÓN AL NEGOCIO</h2>
        <div class="info-grid-4 mb-15">
          <div class="info-item"><div class="label">Negocio Afectado</div><div class="value">{{incidente()?.negocioAfectado || 'N/A'}}</div></div>
          <div class="info-item"><div class="label">Proceso Interno</div><div class="value">{{incidente()?.procesoInternoAfectado || 'N/A'}}</div></div>
          <div class="info-item"><div class="label">Afectación</div><div class="value">{{incidente()?.afectacion || 'N/A'}}</div></div>
          <div class="info-item"><div class="label">Tipo de Afectación</div><div class="value">{{incidente()?.tipoAfectacion || 'N/A'}}</div></div>
        </div>
        
        <div class="text-blockquote mt-15" *ngIf="incidente()?.impacto">
          <strong>Impacto Detallado:</strong><br>
          {{incidente()?.impacto}}
        </div>
        
        <div class="badges-row mt-15">
          <span class="prop-badge" [class.yes]="incidente()?.tieneRespaldo === 'SI'" [class.no]="incidente()?.tieneRespaldo === 'NO'">
            <mat-icon>{{incidente()?.tieneRespaldo === 'SI' ? 'check_circle' : 'cancel'}}</mat-icon> 
            ¿Respaldo?: {{incidente()?.tieneRespaldo || 'Desconocido'}}
          </span>
          <span class="prop-badge" [class.yes]="incidente()?.tienePlanContinuidad === 'SI'" [class.no]="incidente()?.tienePlanContinuidad === 'NO'">
            <mat-icon>{{incidente()?.tienePlanContinuidad === 'SI' ? 'check_circle' : 'cancel'}}</mat-icon> 
            ¿Plan de Continuidad?: {{incidente()?.tienePlanContinuidad || 'Desconocido'}}
          </span>
        </div>
      </div>

      <!-- 4. ACTIVOS COMPROMETIDOS -->
      <div class="content-section" *ngIf="incidente()?.activos?.length">
        <h2 class="font-bebas section-title"><mat-icon>dns</mat-icon> 4. ACTIVOS COMPROMETIDOS</h2>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>IP / Hostname</th>
                <th>Tipo de Activo</th>
                <th>Sistema Operativo</th>
                <th>Acción de Contención</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let activo of incidente()?.activos">
                <td><strong>{{activo.ipHostname}}</strong></td>
                <td><span class="badge" style="background:#e2e8f0; color:#334155">{{activo.tipoActivo || 'N/A'}}</span></td>
                <td>{{activo.sistemaOperativo || 'N/A'}}</td>
                <td>{{activo.accionTomada || 'N/A'}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. CRONOLOGÍA (BITÁCORA) -->
      <div class="content-section timeline-section">
        <h2 class="font-bebas section-title"><mat-icon>history</mat-icon> 5. CRONOLOGÍA DE ACCIONES (BITÁCORA)</h2>
        <div class="timeline" *ngIf="incidente()?.bitacoras?.length; else noTimeline">
          <div class="timeline-item" *ngFor="let item of incidente()?.bitacoras">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="time-header">
                <span class="badge" style="background:#272257">{{item.fechaHora | date:'short'}}</span>
                <strong>{{item.responsableNombre || 'Sistema'}}</strong>
              </div>
              <p class="timeline-action">{{item.accionDetallada}}</p>
            </div>
          </div>
        </div>
        <ng-template #noTimeline>
          <p class="text-muted">No se han registrado acciones en la cronología.</p>
        </ng-template>
      </div>

      <!-- 6. PLAN DE ACCIÓN Y CIERRE -->
      <div class="content-section">
        <h2 class="font-bebas section-title"><mat-icon>next_plan</mat-icon> 6. PLAN DE ACCIÓN</h2>
        <div class="info-grid-3 mb-15">
          <div class="info-item"><div class="label">Responsable Plan</div><div class="value">{{incidente()?.responsablePlanAccion || 'N/A'}}</div></div>
          <div class="info-item"><div class="label">Fecha Estimada Cierre</div><div class="value">{{incidente()?.fechaCierrePlanAccion ? (incidente()?.fechaCierrePlanAccion | date:'mediumDate') : 'N/A'}}</div></div>
          <div class="info-item"><div class="label">Reportado a Entes Ext.</div><div class="value font-bold" [style.color]="incidente()?.reportadoEntesExternos === 'SI' ? '#dc2626' : '#1e293b'">{{incidente()?.reportadoEntesExternos || 'NO'}}</div></div>
        </div>
        <div class="text-blockquote" *ngIf="incidente()?.planAccion">
          <strong>Plan de Acción a Ejecutar:</strong><br>
          {{incidente()?.planAccion}}
        </div>
      </div>

      <!-- 7. LECCIONES APRENDIDAS -->
      <div class="content-section" *ngIf="incidente()?.leccionAprendida?.funcionoBien || incidente()?.leccionAprendida?.fallo || incidente()?.leccionAprendida?.mejoras">
        <h2 class="font-bebas section-title"><mat-icon>school</mat-icon> 7. LECCIONES APRENDIDAS</h2>
        <div class="ll-grid">
          <div class="ll-card success" *ngIf="incidente()?.leccionAprendida?.funcionoBien">
            <h4><mat-icon>check_circle</mat-icon> ¿Qué funcionó bien?</h4>
            <p>{{incidente()?.leccionAprendida?.funcionoBien}}</p>
          </div>
          <div class="ll-card failure" *ngIf="incidente()?.leccionAprendida?.fallo">
            <h4><mat-icon>cancel</mat-icon> ¿Qué falló?</h4>
            <p>{{incidente()?.leccionAprendida?.fallo}}</p>
          </div>
          <div class="ll-card improvement" *ngIf="incidente()?.leccionAprendida?.mejoras">
            <h4><mat-icon>trending_up</mat-icon> Plan de Mejora Continua</h4>
            <p>{{incidente()?.leccionAprendida?.mejoras}}</p>
          </div>
        </div>
      </div>

      <!-- 8. EVIDENCIAS Y ANEXOS -->
      <div class="content-section" *ngIf="incidente()?.evidencias?.length">
        <h2 class="font-bebas section-title"><mat-icon>image</mat-icon> 8. EVIDENCIAS Y ANEXOS</h2>
        <div class="evidence-grid">
          <div class="evidence-card" *ngFor="let ev of incidente()?.evidencias">
            <a [href]="'http://localhost:3000' + ev.archivoUrl" target="_blank" title="Haz clic para ver tamaño completo">
              <img [src]="'http://localhost:3000' + ev.archivoUrl" alt="Evidencia" class="evidence-img" onerror="this.src='assets/no-image.png'">
            </a>
            <div class="evidence-caption">
              <strong>{{ ev.descripcion || 'Evidencia adjunta' }}</strong>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    
    <ng-template #loader>
      <div class="loader-container">Cargando detalle completo del incidente...</div>
    </ng-template>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .font-bold { font-weight: bold; }
    .w-100 { width: 100%; }
    .detail-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Montserrat', sans-serif; }
    
    .detail-header { background-color: #272257; color: white; padding: 25px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .codigo { font-size: 20px; color: #a5b4fc; margin-bottom: 5px; }
    .title-section h1 { margin: 0 0 15px 0; font-size: 28px; line-height: 1.2; }
    .badges { display: flex; gap: 10px; flex-wrap: wrap; }
    
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; }
    .sev-baja { background-color: #16a34a; }
    .sev-media { background-color: #f59e0b; }
    .sev-alta { background-color: #ea580c; }
    .sev-critica { background-color: #dc2626; }
    .status { background-color: #2563eb; }
    
    .actions-section { display: flex; gap: 10px; }
    .btn-outline { background: white; color: #272257; }
    
    .info-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .info-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .info-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    
    .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; }
    .info-item .label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 5px; font-weight: 600; }
    .info-item .value { font-size: 15px; color: #1e293b; }
    
    .content-section { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 25px; }
    .section-title { color: #272257; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; display: flex; align-items: center; gap: 10px; }
    
    .text-blockquote { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #272257; white-space: pre-wrap; line-height: 1.6; color: #334155; }
    .text-muted { color: #64748b; font-style: italic; }
    
    .mb-15 { margin-bottom: 15px; }
    .mb-20 { margin-bottom: 20px; }
    .mt-15 { margin-top: 15px; }
    
    .badges-row { display: flex; gap: 15px; }
    .prop-badge { display: flex; align-items: center; gap: 5px; padding: 8px 15px; border-radius: 20px; font-size: 13px; font-weight: bold; background: #f1f5f9; color: #475569; }
    .prop-badge.yes { background: #dcfce7; color: #166534; }
    .prop-badge.no { background: #fee2e2; color: #991b1b; }
    .prop-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }
    
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; }
    .data-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    
    .timeline { position: relative; padding-left: 20px; margin-top: 15px; }
    .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
    .timeline-item { position: relative; margin-bottom: 25px; }
    .timeline-marker { position: absolute; left: -26px; top: 5px; width: 14px; height: 14px; border-radius: 50%; background: #272257; border: 3px solid white; box-shadow: 0 0 0 1px #e2e8f0; }
    .timeline-content { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-left: 10px; }
    .time-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; color: #475569; }
    .timeline-action { margin: 0; color: #1e293b; line-height: 1.5; font-weight: 500; }
    
    .ll-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 15px; }
    .ll-card { padding: 20px; border-radius: 8px; border-left: 4px solid; }
    .ll-card h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 10px 0; font-size: 16px; }
    .ll-card p { margin: 0; line-height: 1.5; }
    .ll-card.success { background: #f0fdf4; border-color: #16a34a; color: #166534; }
    .ll-card.success h4 { color: #15803d; }
    .ll-card.failure { background: #fef2f2; border-color: #dc2626; color: #991b1b; }
    .ll-card.failure h4 { color: #b91c1c; }
    .ll-card.improvement { background: #eff6ff; border-color: #2563eb; color: #1e40af; }
    .ll-card.improvement h4 { color: #1d4ed8; }
    
    .loader-container { padding: 50px; text-align: center; color: #64748b; font-family: 'Montserrat', sans-serif; }
    
    .evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 15px; }
    .evidence-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; transition: transform 0.2s; }
    .evidence-card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .evidence-img { width: 100%; height: 200px; object-fit: cover; border-bottom: 1px solid #e2e8f0; cursor: pointer; background: #fff; }
    .evidence-caption { padding: 15px; font-size: 13px; color: #334155; text-align: center; }
  `]
})
export class IncidenteDetailComponent implements OnInit {
  incidente = signal<any>(null);

  constructor(
    private service: IncidentesService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private pdfService: PdfGeneratorService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(id: string) {
    this.service.getOne(id).subscribe({
      next: (res) => {
        if(res) {
          this.incidente.set(res);
        } else {
          this.snackBar.open('Incidente no encontrado', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Error cargando detalle completo del incidente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  generatePDF() {
    if (!this.incidente()) return;
    this.snackBar.open('Generando informe PDF...', 'Cerrar', { duration: 3000 });
    this.pdfService.generateIncidentePdf(this.incidente());
  }
}
