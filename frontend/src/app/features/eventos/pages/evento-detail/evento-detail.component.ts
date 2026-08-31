import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventosService } from '../../../../core/services/eventos.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';

@Component({
  selector: 'app-evento-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="detail-container" *ngIf="evento(); else loader">
      <header class="detail-header">
        <div class="title-section">
          <div class="codigo font-bebas">{{evento()?.codigo}}</div>
          <h1>{{evento()?.titulo}}</h1>
          <div class="badges">
            <span class="badge sev-{{evento()?.severidad | lowercase}}">{{evento()?.severidad}}</span>
            <span class="badge status-{{evento()?.estado | lowercase}}">{{evento()?.estado}}</span>
            <span class="badge type">{{evento()?.tipo}}</span>
          </div>
        </div>
        <div class="actions-section">
          <button mat-raised-button class="btn-outline" (click)="generatePDF()">
            <mat-icon>picture_as_pdf</mat-icon> INFORME PDF
          </button>
          <button mat-raised-button color="warn" [routerLink]="['/incidentes/nuevo']" [queryParams]="{origen: evento()?.id}">
            <mat-icon>campaign</mat-icon> ESCALAR A INCIDENTE
          </button>
          <button mat-raised-button class="btn-outline" [routerLink]="['/eventos', evento()?.id, 'editar']">
            <mat-icon>edit</mat-icon> EDITAR
          </button>
        </div>
      </header>

      <div class="info-grid-3">
        <div class="info-item">
          <div class="label">Registrado / Reportado Por</div>
          <div class="value font-bold" style="color:#2563eb">{{evento()?.reportadoPor || (evento()?.creadoPorId === '00000000-0000-0000-0000-000000000001' ? 'Administrador CSIRT (SOC)' : (evento()?.creadoPorId || 'Sistema'))}}</div>
        </div>
        <div class="info-item">
          <div class="label">Fecha Detección</div>
          <div class="value font-bold">{{evento()?.fechaDeteccion | date:'medium'}}</div>
        </div>
        <div class="info-item">
          <div class="label">Origen / IP</div>
          <div class="value font-mono">{{evento()?.origen || 'N/A'}}</div>
        </div>
      </div>

      <div class="content-section">
        <h2 class="font-bebas section-title"><mat-icon>description</mat-icon> DESCRIPCIÓN DEL EVENTO</h2>
        <div class="text-content">{{evento()?.descripcion}}</div>
      </div>
      
      <div class="content-section" *ngIf="evento()?.evidencias?.length">
        <h2 class="font-bebas section-title"><mat-icon>image</mat-icon> EVIDENCIAS Y ANEXOS</h2>
        <div class="evidence-grid">
          <div class="evidence-card" *ngFor="let ev of evento()?.evidencias">
            <a [href]="'http://localhost:3000' + ev.archivoUrl" target="_blank" title="Haz clic para ver tamaño completo">
              <img [src]="'http://localhost:3000' + ev.archivoUrl" alt="Evidencia" class="evidence-img">
            </a>
            <div class="evidence-caption">
              <strong>{{ ev.descripcion || 'Evidencia adjunta' }}</strong>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    
    <ng-template #loader>
      <div class="loader-container">Cargando evento...</div>
    </ng-template>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .font-bold { font-weight: bold; }
    .font-mono { font-family: monospace; font-size: 16px; color: #dc2626 !important; }
    
    .detail-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Montserrat', sans-serif; }
    
    .detail-header { background-color: #272257; color: white; padding: 25px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
    .codigo { font-size: 20px; color: #a5b4fc; margin-bottom: 5px; }
    .title-section h1 { margin: 0 0 15px 0; font-size: 28px; line-height: 1.2; }
    .badges { display: flex; gap: 10px; flex-wrap: wrap; }
    
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; text-transform: uppercase; }
    .sev-baja { background-color: #16a34a; }
    .sev-media { background-color: #f59e0b; }
    .sev-alta { background-color: #ea580c; }
    .sev-critica { background-color: #dc2626; }
    
    .status-nuevo { background-color: #3b82f6; }
    .status-en_analisis { background-color: #f59e0b; }
    .status-escalado { background-color: #dc2626; }
    
    .type { background-color: #475569; }
    
    .actions-section { display: flex; gap: 10px; flex-direction: column; }
    .btn-outline { background: white; color: #272257; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .info-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
    .info-item { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b; }
    .info-item .label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 5px; font-weight: 600; }
    .info-item .value { font-size: 16px; color: #1e293b; }
    
    .content-section { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 25px; }
    .section-title { color: #272257; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; display: flex; align-items: center; gap: 10px; }
    .text-content { white-space: pre-wrap; line-height: 1.6; color: #334155; }
    
    .loader-container { padding: 50px; text-align: center; color: #64748b; font-family: 'Montserrat', sans-serif; }
    
    .evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 15px; }
    .evidence-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; transition: transform 0.2s; }
    .evidence-card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .evidence-img { width: 100%; height: 200px; object-fit: cover; border-bottom: 1px solid #e2e8f0; cursor: pointer; }
    .evidence-caption { padding: 15px; font-size: 13px; color: #334155; text-align: center; }
  `]
})
export class EventoDetailComponent implements OnInit {
  evento = signal<any>(null);

  constructor(
    private service: EventosService,
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
      next: (res) => this.evento.set(res || this.getMockData(id)),
      error: () => this.evento.set(this.getMockData(id))
    });
  }

  generatePDF() {
    if (!this.evento()) return;
    this.snackBar.open('Generando informe PDF...', 'Cerrar', { duration: 3000 });
    this.pdfService.generateEventoPdf(this.evento());
  }

  private getMockData(id: string) {
    return {
      id, codigo: 'EVT-2023-045', titulo: 'Escaneo Nmap detectado',
      tipo: 'ESCANEO_PUERTOS', severidad: 'BAJA', estado: 'NUEVO',
      origen: '190.23.44.11', fechaDeteccion: new Date(),
      descripcion: 'El firewall perimetral detectó un escaneo de puertos SYN masivo proveniente de la IP indicada, dirigido hacia el segmento DMZ.'
    };
  }
}
